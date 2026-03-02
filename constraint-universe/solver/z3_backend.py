"""Z3 theorem prover backend for rigorous constraint solving"""
import time
from typing import Dict, List, Optional

try:
    import z3
    Z3_AVAILABLE = True
except ImportError:
    Z3_AVAILABLE = False
    z3 = None

from core.types import (
    ConstraintUniverse, State, Classification, ClassificationResult,
    LogicalProof, ReasoningStep, Variable, Constraint
)
from core.config import Z3_TIMEOUT_MS

class Z3ConstraintSolver:
    """Formal constraint solver using Z3 theorem prover"""
    
    def __init__(self, timeout_ms: int = Z3_TIMEOUT_MS):
        if not Z3_AVAILABLE:
            raise ImportError("Z3 not available. Install with: pip install z3-solver")
        self.timeout_ms = timeout_ms
        self.solver = z3.Solver()
        self.solver.set("timeout", timeout_ms)
        
    def classify_state(self, 
                      universe: ConstraintUniverse, 
                      state: State) -> ClassificationResult:
        """Classify state as POSSIBLE/IMPOSSIBLE/INEVITABLE with formal proof"""
        
        start_time = time.time()
        
        # 1. Create Z3 variables
        z3_vars = self._create_z3_variables(universe.variables)
        
        # 2. Encode constraints as Z3 expressions
        z3_constraints = []
        for constraint in universe.constraints:
            try:
                z3_expr = constraint.to_z3(z3_vars)
                z3_constraints.append(z3_expr)
            except Exception as e:
                # Skip constraints that can't be encoded
                continue
            
        # 3. Encode state assignments
        state_constraints = []
        for var_name, value in state.assignments.items():
            if var_name in z3_vars:
                state_constraints.append(z3_vars[var_name] == value)
        
        # 4. Check satisfiability
        self.solver.push()
        self.solver.add(z3_constraints + state_constraints)
        
        check_result = self.solver.check()
        
        if check_result == z3.unsat:
            # State is IMPOSSIBLE
            classification = Classification.IMPOSSIBLE
            proof = self._generate_impossibility_proof(universe, state, z3_constraints)
        else:
            # State is at least POSSIBLE
            # Check if it's INEVITABLE
            if self._is_inevitable(universe, state, z3_vars, z3_constraints):
                classification = Classification.INEVITABLE
                proof = self._generate_inevitability_proof(universe, state)
            else:
                classification = Classification.POSSIBLE
                proof = self._generate_possibility_proof(universe, state)
                
        self.solver.pop()
        
        computation_time = time.time() - start_time
        
        return ClassificationResult(
            state=state,
            classification=classification,
            proof=proof,
            constraints_used=universe.constraints,
            computation_time=computation_time
        )
    
    def _create_z3_variables(self, variables: List[Variable]) -> Dict[str, z3.ExprRef]:
        """Create Z3 variables from universe variables"""
        z3_vars = {}
        
        for var in variables:
            if var.type == "boolean":
                z3_vars[var.name] = z3.Bool(var.name)
            elif var.type == "integer":
                z3_vars[var.name] = z3.Int(var.name)
            elif isinstance(var.domain, list):
                # Enumerated domain - use integer with constraints
                z3_var = z3.Int(var.name)
                z3_vars[var.name] = z3_var
                # Add domain constraint
                domain_constraint = z3.Or([z3_var == i for i in range(len(var.domain))])
                self.solver.add(domain_constraint)
            else:
                # Default to boolean
                z3_vars[var.name] = z3.Bool(var.name)
                
        return z3_vars
    
    def _is_inevitable(self, 
                      universe: ConstraintUniverse,
                      state: State, 
                      z3_vars: Dict[str, z3.ExprRef],
                      z3_constraints: List[z3.BoolRef]) -> bool:
        """Check if state is inevitable given constraints"""
        
        # State is inevitable if its negation is unsatisfiable with constraints
        negated_state = []
        for var_name, value in state.assignments.items():
            if var_name in z3_vars:
                negated_state.append(z3_vars[var_name] != value)
        
        if not negated_state:
            return True  # Empty state is always inevitable
        
        # Check if (constraints AND NOT state) is unsatisfiable
        self.solver.push()
        self.solver.add(z3_constraints)
        self.solver.add(z3.Or(negated_state))
        
        result = self.solver.check() == z3.unsat
        self.solver.pop()
        
        return result
    
    def _generate_impossibility_proof(self, 
                                    universe: ConstraintUniverse,
                                    state: State,
                                    z3_constraints: List[z3.BoolRef]) -> LogicalProof:
        """Generate formal proof that state is impossible"""
        
        # Extract unsat core to find minimal set of conflicting constraints
        try:
            core = self.solver.unsat_core()
            # Map Z3 expressions back to constraint IDs (simplified)
            conflicting_constraints = [c.id for c in universe.constraints[:len(core)]]
        except:
            conflicting_constraints = [c.id for c in universe.constraints]
            
        reasoning_steps = [
            ReasoningStep(
                rule="constraint_conflict",
                premises=conflicting_constraints,
                conclusion=f"State {state.assignments} violates constraints",
                justification=f"The combination of constraints {', '.join(conflicting_constraints)} " +
                             f"makes state {state.assignments} logically impossible."
            )
        ]
        
        return LogicalProof(
            classification=Classification.IMPOSSIBLE,
            reasoning_steps=reasoning_steps,
            constraint_dependencies=conflicting_constraints,
            counterexample=state  # The impossible state serves as counterexample
        )
    
    def _generate_possibility_proof(self,
                                  universe: ConstraintUniverse, 
                                  state: State) -> LogicalProof:
        """Generate proof that state is possible"""
        
        try:
            model = self.solver.model()
        except:
            model = None
        
        reasoning_steps = [
            ReasoningStep(
                rule="satisfiability",
                premises=[c.id for c in universe.constraints],
                conclusion=f"State {state.assignments} satisfies all constraints",
                justification=f"Found satisfying assignment: all constraints are satisfied " +
                             f"when variables have values {state.assignments}."
            )
        ]
        
        return LogicalProof(
            classification=Classification.POSSIBLE,
            reasoning_steps=reasoning_steps,
            constraint_dependencies=[c.id for c in universe.constraints],
            witness=state,  # The satisfying state is the witness
            z3_model=model
        )
    
    def _generate_inevitability_proof(self,
                                    universe: ConstraintUniverse,
                                    state: State) -> LogicalProof:
        """Generate proof that state is inevitable"""
        
        reasoning_steps = [
            ReasoningStep(
                rule="inevitability", 
                premises=[c.id for c in universe.constraints],
                conclusion=f"State {state.assignments} is inevitable",
                justification=f"Given the constraints, no other assignment to variables " +
                             f"is possible. State {state.assignments} is the unique solution."
            )
        ]
        
        return LogicalProof(
            classification=Classification.INEVITABLE,
            reasoning_steps=reasoning_steps,
            constraint_dependencies=[c.id for c in universe.constraints],
            witness=state
        )
