"""CLI entry point for Spine Decision Runtime."""

import click
import sys
import json
from pathlib import Path

from .parser import parse_case_file
from .analyzer import DecisionAnalyzer
from .output import print_analysis, export_trace_json, explain_output, print_falsification_tests
from .ledger import OutcomeLedger
from .registry import CaseRegistry


@click.group()
def cli():
    """Spine Decision Runtime - Analyze decision problems against contracts."""
    pass


@cli.command()
@click.argument('case_file', type=click.Path(exists=True))
@click.option('--contracts-dir', type=click.Path(exists=True), help='Path to contracts directory')
@click.option('--trace', is_flag=True, help='Output full trace graph as JSON')
@click.option('--explain', type=str, help='Show reasoning chain for specific output node ID')
@click.option('--record-predictions', is_flag=True, help='Record predictions to outcome ledger')
@click.option('--falsify', is_flag=True, help='Output falsification tests only')
@click.option('--register', is_flag=True, help='Register case and record run in registry')
@click.option('--design-data', type=click.Path(exists=True), help='Path to design data JSON file')
def analyze(case_file: str, contracts_dir: str = None, trace: bool = False, explain: str = None, record_predictions: bool = False, falsify: bool = False, register: bool = False, design_data: str = None):
    """
    Analyze a case file and output decision analysis.
    
    CASE_FILE: Path to the case.yaml file to analyze
    """
    try:
        # Parse case file
        case = parse_case_file(case_file)
        
        # Initialize analyzer
        analyzer = DecisionAnalyzer(contracts_dir=contracts_dir)
        
        # Initialize ledger if recording predictions
        ledger = OutcomeLedger() if record_predictions else None
        
        # Load design data if provided
        design_data_dict = None
        if design_data:
            with open(design_data, 'r') as f:
                design_data_dict = json.load(f)
        
        # Analyze
        analysis = analyzer.analyze(case, ledger=ledger, design_data=design_data_dict)
        
        # Register case and run if requested
        if register:
            registry = CaseRegistry()
            
            # Convert case to dict for storage
            case_yaml_dict = {
                "problem": {
                    "name": case.problem.name,
                    "domain": case.problem.domain
                },
                "constraints": case.constraints,
                "uncertainties": case.uncertainties,
                "objectives": case.objectives
            }
            
            # Register case
            case_id = registry.register_case(
                name=case.problem.name,
                domain=case.problem.domain,
                case_yaml=case_yaml_dict,
                design_data=design_data_dict
            )
            
            # Convert analysis to dict
            analysis_dict = analysis.dict()
            
            # Record run
            run_id = registry.record_run(
                case_id=case_id,
                output=analysis_dict,
                trace=analysis.trace_graph
            )
            
            click.echo(f"Registered case: {case_id}")
            click.echo(f"Recorded run: {run_id}")
        
        # Handle explain flag
        if explain:
            explanation = explain_output(analysis, explain)
            click.echo(explanation)
            return
        
        # Handle trace flag
        if trace:
            trace_json = export_trace_json(analysis)
            click.echo(trace_json)
            return
        
        # Handle falsify flag
        if falsify:
            print_falsification_tests(analysis)
            return
        
        # Output results
        print_analysis(analysis)
        
    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error analyzing case: {e}", err=True)
        sys.exit(1)


@cli.group()
def ledger():
    """Manage outcome ledger for prediction tracking and calibration."""
    pass


@ledger.command('list')
def ledger_list():
    """List pending predictions awaiting outcome."""
    try:
        ledger = OutcomeLedger()
        pending = ledger.list_pending()
        
        if not pending:
            click.echo("No pending predictions.")
            return
        
        click.echo(f"Pending predictions ({len(pending)}):\n")
        for pred in pending:
            click.echo(f"  ID: {pred.id}")
            click.echo(f"  Type: {pred.prediction_type}")
            click.echo(f"  Content: {pred.content}")
            click.echo(f"  Confidence: {pred.confidence:.2f}")
            click.echo(f"  Run ID: {pred.run_id}")
            click.echo(f"  Timestamp: {pred.timestamp.isoformat()}")
            click.echo()
        
    except Exception as e:
        click.echo(f"Error listing predictions: {e}", err=True)
        sys.exit(1)


@ledger.command('record')
@click.argument('pred_id')
@click.option('--occurred', is_flag=True, help='Prediction occurred')
@click.option('--not-occurred', is_flag=True, help='Prediction did not occur')
@click.option('--notes', type=str, help='Additional notes about the outcome')
def ledger_record(pred_id: str, occurred: bool, not_occurred: bool, notes: str = None):
    """Record outcome for a prediction."""
    try:
        if not occurred and not not_occurred:
            click.echo("Error: Must specify either --occurred or --not-occurred", err=True)
            sys.exit(1)
        
        if occurred and not_occurred:
            click.echo("Error: Cannot specify both --occurred and --not-occurred", err=True)
            sys.exit(1)
        
        ledger = OutcomeLedger()
        outcome = {"notes": notes} if notes else {}
        actual_occurred = occurred
        
        calibration_error = ledger.record_outcome(pred_id, outcome, actual_occurred)
        click.echo(f"Recorded outcome for prediction {pred_id}")
        click.echo(f"Calibration error: {calibration_error:.3f}")
        
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error recording outcome: {e}", err=True)
        sys.exit(1)


@ledger.command('stats')
def ledger_stats():
    """Show calibration statistics."""
    try:
        ledger = OutcomeLedger()
        stats = ledger.get_calibration_stats()
        
        click.echo("Calibration Statistics:")
        click.echo(f"  Total predictions: {stats['total_predictions']}")
        click.echo(f"  Completed: {stats['completed']}")
        
        if stats['completed'] == 0:
            click.echo("  No completed predictions yet.")
        else:
            click.echo(f"  Mean calibration error: {stats['mean_calibration_error']:.3f}")
            if stats.get('by_type'):
                click.echo("\n  By type:")
                for pred_type, mean_error in stats['by_type'].items():
                    click.echo(f"    {pred_type}: {mean_error:.3f}")
        
    except Exception as e:
        click.echo(f"Error getting stats: {e}", err=True)
        sys.exit(1)


@cli.command('falsify')
@click.argument('case_file', type=click.Path(exists=True))
@click.option('--contracts-dir', type=click.Path(exists=True), help='Path to contracts directory')
@click.option('--cheapest', type=int, help='Show only N cheapest tests')
@click.option('--priority', type=int, help='Show only tests with this priority (1=highest)')
def falsify(case_file: str, contracts_dir: str = None, cheapest: int = None, priority: int = None):
    """
    Generate falsification tests for a case file.
    
    CASE_FILE: Path to the case.yaml file to analyze
    """
    try:
        # Parse case file
        case = parse_case_file(case_file)
        
        # Initialize analyzer
        analyzer = DecisionAnalyzer(contracts_dir=contracts_dir)
        
        # Analyze
        analysis = analyzer.analyze(case)
        
        # Filter tests if requested
        tests = analysis.falsification_tests
        if priority:
            tests = [t for t in tests if t.priority == priority]
        if cheapest:
            cost_order = {"low": 0, "medium": 1, "high": 2}
            tests = sorted(tests, key=lambda t: cost_order.get(t.estimated_cost, 3))[:cheapest]
        
        # Create filtered analysis
        from .schemas import DecisionAnalysis
        filtered_analysis = DecisionAnalysis(
            decision_map=analysis.decision_map,
            failure_modes=analysis.failure_modes,
            contradictions=analysis.contradictions,
            unknowns=analysis.unknowns,
            recommended_experiments=analysis.recommended_experiments,
            falsification_tests=tests,
            trace_graph=analysis.trace_graph
        )
        
        # Output falsification tests
        print_falsification_tests(filtered_analysis)
        
    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error analyzing case: {e}", err=True)
        sys.exit(1)


@cli.group()
def registry():
    """Manage case registry for decision corpus."""
    pass


@registry.command('list')
@click.option('--domain', type=str, help='Filter by domain')
@click.option('--tag', type=str, help='Filter by tag')
def registry_list(domain: str = None, tag: str = None):
    """List all registered cases."""
    try:
        registry = CaseRegistry()
        cases = registry.list_cases(domain=domain, tag=tag)
        
        if not cases:
            click.echo("No cases found.")
            return
        
        click.echo(f"Registered Cases ({len(cases)}):\n")
        for case_info in cases:
            click.echo(f"  ID: {case_info['case_id']}")
            click.echo(f"  Name: {case_info['name']}")
            click.echo(f"  Domain: {case_info['domain']}")
            click.echo(f"  Created: {case_info['created_at']}")
            click.echo(f"  Runs: {case_info.get('run_count', 0)}")
            if case_info.get('tags'):
                click.echo(f"  Tags: {', '.join(case_info['tags'])}")
            click.echo()
        
    except Exception as e:
        click.echo(f"Error listing cases: {e}", err=True)
        sys.exit(1)


@registry.command('add')
@click.argument('case_file', type=click.Path(exists=True))
@click.option('--design-data', type=click.Path(exists=True), help='Path to design data JSON file')
@click.option('--tags', type=str, help='Comma-separated tags')
@click.option('--notes', type=str, help='Notes about the case')
def registry_add(case_file: str, design_data: str = None, tags: str = None, notes: str = None):
    """Register a case file in the registry."""
    try:
        # Parse case file
        case = parse_case_file(case_file)
        
        # Load design data if provided
        design_data_dict = None
        if design_data:
            with open(design_data, 'r') as f:
                design_data_dict = json.load(f)
        
        # Convert case to dict
        case_yaml_dict = {
            "problem": {
                "name": case.problem.name,
                "domain": case.problem.domain
            },
            "constraints": case.constraints,
            "uncertainties": case.uncertainties,
            "objectives": case.objectives
        }
        
        # Parse tags
        tags_list = [t.strip() for t in tags.split(',')] if tags else []
        
        # Register case
        registry = CaseRegistry()
        case_id = registry.register_case(
            name=case.problem.name,
            domain=case.problem.domain,
            case_yaml=case_yaml_dict,
            design_data=design_data_dict,
            tags=tags_list,
            notes=notes or ""
        )
        
        click.echo(f"Registered case: {case_id}")
        
    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error registering case: {e}", err=True)
        sys.exit(1)


@registry.command('run')
@click.argument('case_id')
@click.option('--contracts-dir', type=click.Path(exists=True), help='Path to contracts directory')
@click.option('--record-predictions', is_flag=True, help='Record predictions to outcome ledger')
def registry_run(case_id: str, contracts_dir: str = None, record_predictions: bool = False):
    """Analyze a registered case and record the run."""
    try:
        registry = CaseRegistry()
        case_record = registry.get_case(case_id)
        
        if not case_record:
            click.echo(f"Error: Case {case_id} not found", err=True)
            sys.exit(1)
        
        # Reconstruct CaseInput from stored data
        from .schemas import CaseInput, ProblemDefinition
        case = CaseInput(
            problem=ProblemDefinition(**case_record.case_yaml["problem"]),
            constraints=case_record.case_yaml.get("constraints", []),
            uncertainties=case_record.case_yaml.get("uncertainties", []),
            objectives=case_record.case_yaml.get("objectives", [])
        )
        
        # Initialize analyzer
        analyzer = DecisionAnalyzer(contracts_dir=contracts_dir)
        
        # Initialize ledger if recording predictions
        ledger = OutcomeLedger() if record_predictions else None
        
        # Analyze
        analysis = analyzer.analyze(case, ledger=ledger, design_data=case_record.design_data)
        
        # Convert analysis to dict
        analysis_dict = analysis.dict()
        
        # Record run
        run_id = registry.record_run(
            case_id=case_id,
            output=analysis_dict,
            trace=analysis.trace_graph
        )
        
        click.echo(f"Recorded run: {run_id}")
        click.echo(f"Case: {case_record.name} ({case_id})")
        
    except Exception as e:
        click.echo(f"Error running case: {e}", err=True)
        sys.exit(1)


@registry.command('stats')
def registry_stats():
    """Show registry statistics."""
    try:
        registry = CaseRegistry()
        stats = registry.get_stats()
        
        click.echo("Registry Statistics:")
        click.echo(f"  Total cases: {stats['total_cases']}")
        click.echo(f"  Total runs: {stats['total_runs']}")
        
        if stats.get('by_domain'):
            click.echo("\n  By domain:")
            for domain, count in stats['by_domain'].items():
                click.echo(f"    {domain}: {count}")
        
        if stats.get('by_outcome_status'):
            click.echo("\n  By outcome status:")
            for status, count in stats['by_outcome_status'].items():
                click.echo(f"    {status}: {count}")
        
    except Exception as e:
        click.echo(f"Error getting stats: {e}", err=True)
        sys.exit(1)


@registry.command('export')
@click.argument('output_file', type=click.Path())
def registry_export(output_file: str):
    """Export entire corpus to a JSON file."""
    try:
        registry = CaseRegistry()
        registry.export_corpus(output_file)
        click.echo(f"Exported corpus to {output_file}")
        
    except Exception as e:
        click.echo(f"Error exporting corpus: {e}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cli()
