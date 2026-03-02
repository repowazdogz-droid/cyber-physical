"""Formal constraints - machine-checkable predicates."""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from abc import ABC, abstractmethod

# Import geometry probe for geometric analysis
try:
    from .geometry_probe import (
        tolerance_stack_analysis, PartTolerance,
        thermal_expansion_mismatch, thermal_dimensional_change,
        deflection_clearance_loss,
        assembly_error_propagation, AssemblyStage,
        trajectory_sweep_check
    )
except ImportError:
    # Fallback if geometry_probe not available
    tolerance_stack_analysis = None
    thermal_expansion_mismatch = None
    deflection_clearance_loss = None
    assembly_error_propagation = None
    trajectory_sweep_check = None


class CheckResult(Enum):
    """Result of checking a formal constraint."""
    PROVEN_SATISFIED = "proven_satisfied"
    PROVEN_VIOLATED = "proven_violated"
    UNKNOWN = "unknown"  # Cannot determine from available data


@dataclass
class ConstraintCheckResult:
    """Result of checking a formal constraint."""
    constraint_id: str
    constraint_name: str
    result: CheckResult
    value: Optional[float] = None      # Actual value if measurable
    threshold: Optional[float] = None  # Threshold being checked
    margin: Optional[float] = None     # How much margin (positive = satisfied)
    evidence: str = ""                 # Explanation
    confidence: float = 1.0            # 1.0 for proven, <1.0 for heuristic


class FormalConstraint(ABC):
    """Base class for machine-checkable constraints."""
    
    def __init__(self, constraint_id: str, name: str, description: str):
        self.constraint_id = constraint_id
        self.name = name
        self.description = description
    
    @abstractmethod
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        """Check if constraint is satisfied given design data."""
        pass


class MassLimitConstraint(FormalConstraint):
    """Total mass must not exceed limit."""
    
    def __init__(self, max_mass_kg: float = 10.0):
        super().__init__(
            constraint_id="FORMAL_001",
            name="mass_limit",
            description=f"Total mass must not exceed {max_mass_kg} kg"
        )
        self.max_mass_kg = max_mass_kg
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        total_mass = design_data.get("total_mass_kg")
        if total_mass is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_mass_kg,
                evidence="Total mass not provided in design data",
                confidence=0.0
            )
        
        margin = self.max_mass_kg - total_mass
        if total_mass <= self.max_mass_kg:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                value=total_mass,
                threshold=self.max_mass_kg,
                margin=margin,
                evidence=f"Mass {total_mass:.2f} kg <= limit {self.max_mass_kg} kg (margin: {margin:.2f} kg)",
                confidence=1.0
            )
        else:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=total_mass,
                threshold=self.max_mass_kg,
                margin=margin,
                evidence=f"Mass {total_mass:.2f} kg EXCEEDS limit {self.max_mass_kg} kg (violation: {-margin:.2f} kg)",
                confidence=1.0
            )


class MaxForceConstraint(FormalConstraint):
    """Maximum applied force must not exceed limit."""
    
    def __init__(self, max_force_n: float = 2.0):
        super().__init__(
            constraint_id="FORMAL_002",
            name="max_force",
            description=f"Applied force must not exceed {max_force_n} N"
        )
        self.max_force_n = max_force_n
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        max_force = design_data.get("max_force_n")
        if max_force is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_force_n,
                evidence="Max force not provided in design data",
                confidence=0.0
            )
        
        margin = self.max_force_n - max_force
        if max_force <= self.max_force_n:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                value=max_force,
                threshold=self.max_force_n,
                margin=margin,
                evidence=f"Force {max_force:.2f} N <= limit {self.max_force_n} N",
                confidence=1.0
            )
        else:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=max_force,
                threshold=self.max_force_n,
                margin=margin,
                evidence=f"Force {max_force:.2f} N EXCEEDS limit {self.max_force_n} N",
                confidence=1.0
            )


class MaxAccelerationConstraint(FormalConstraint):
    """Maximum acceleration must not exceed limit."""
    
    def __init__(self, max_accel_mps2: float = 50.0):
        super().__init__(
            constraint_id="FORMAL_003",
            name="max_acceleration",
            description=f"Acceleration must not exceed {max_accel_mps2} m/s²"
        )
        self.max_accel_mps2 = max_accel_mps2
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        max_accel = design_data.get("max_acceleration_mps2")
        if max_accel is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_accel_mps2,
                evidence="Max acceleration not provided",
                confidence=0.0
            )
        
        margin = self.max_accel_mps2 - max_accel
        satisfied = max_accel <= self.max_accel_mps2
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=max_accel,
            threshold=self.max_accel_mps2,
            margin=margin,
            evidence=f"Acceleration {max_accel:.2f} m/s² {'<=' if satisfied else 'EXCEEDS'} limit",
            confidence=1.0
        )


class MinClearanceConstraint(FormalConstraint):
    """Minimum clearance between components."""
    
    def __init__(self, min_clearance_mm: float = 1.0):
        super().__init__(
            constraint_id="FORMAL_004",
            name="min_clearance",
            description=f"Minimum clearance must be >= {min_clearance_mm} mm"
        )
        self.min_clearance_mm = min_clearance_mm
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        clearance = design_data.get("min_clearance_mm")
        if clearance is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.min_clearance_mm,
                evidence="Clearance not provided",
                confidence=0.0
            )
        
        margin = clearance - self.min_clearance_mm
        satisfied = clearance >= self.min_clearance_mm
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=clearance,
            threshold=self.min_clearance_mm,
            margin=margin,
            evidence=f"Clearance {clearance:.2f} mm {'>=' if satisfied else 'BELOW'} minimum",
            confidence=1.0
        )


class SelfCollisionConstraint(FormalConstraint):
    """No self-collision in range of motion."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_005",
            name="no_self_collision",
            description="No self-collision throughout range of motion"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        collision_detected = design_data.get("self_collision_detected")
        if collision_detected is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Self-collision check not performed",
                confidence=0.0
            )
        
        if collision_detected:
            collision_pairs = design_data.get("collision_pairs", [])
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                evidence=f"Self-collision detected: {collision_pairs}",
                confidence=1.0
            )
        else:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                evidence="No self-collision detected in simulation",
                confidence=1.0
            )


class COGStabilityConstraint(FormalConstraint):
    """COG must be within support polygon (tip-over prevention)."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_006",
            name="cog_stability",
            description="Center of gravity must be within support polygon"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        cog_within_polygon = design_data.get("cog_within_support_polygon")
        if cog_within_polygon is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="COG stability check not performed",
                confidence=0.0
            )
        
        if cog_within_polygon:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                value=1.0,
                threshold=1.0,
                margin=1.0,
                evidence="COG is within support polygon",
                confidence=1.0
            )
        else:
            cog_offset_mm = design_data.get("cog_offset_mm", 0.0)
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=0.0,
                threshold=1.0,
                margin=-1.0,
                evidence=f"COG is outside support polygon (offset: {cog_offset_mm:.2f} mm)",
                confidence=1.0
            )


class TorqueLimitConstraint(FormalConstraint):
    """Joint torque must not exceed actuator rated torque."""
    
    def __init__(self, max_torque_nm: float = 5.0):
        super().__init__(
            constraint_id="FORMAL_007",
            name="torque_limit",
            description=f"Joint torque must not exceed {max_torque_nm} N⋅m"
        )
        self.max_torque_nm = max_torque_nm
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        max_torque = design_data.get("max_torque_nm")
        if max_torque is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_torque_nm,
                evidence="Max torque not provided in design data",
                confidence=0.0
            )
        
        margin = self.max_torque_nm - max_torque
        satisfied = max_torque <= self.max_torque_nm
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=max_torque,
            threshold=self.max_torque_nm,
            margin=margin,
            evidence=f"Torque {max_torque:.2f} N⋅m {'<=' if satisfied else 'EXCEEDS'} limit {self.max_torque_nm} N⋅m",
            confidence=1.0
        )


class JerkLimitConstraint(FormalConstraint):
    """Jerk must not exceed threshold."""
    
    def __init__(self, max_jerk_mps3: float = 500.0):
        super().__init__(
            constraint_id="FORMAL_008",
            name="jerk_limit",
            description=f"Jerk must not exceed {max_jerk_mps3} m/s³"
        )
        self.max_jerk_mps3 = max_jerk_mps3
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        max_jerk = design_data.get("max_jerk_mps3")
        if max_jerk is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_jerk_mps3,
                evidence="Max jerk not provided in design data",
                confidence=0.0
            )
        
        margin = self.max_jerk_mps3 - max_jerk
        satisfied = max_jerk <= self.max_jerk_mps3
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=max_jerk,
            threshold=self.max_jerk_mps3,
            margin=margin,
            evidence=f"Jerk {max_jerk:.2f} m/s³ {'<=' if satisfied else 'EXCEEDS'} limit {self.max_jerk_mps3} m/s³",
            confidence=1.0
        )


class ActuatorDutyCycleConstraint(FormalConstraint):
    """Continuous load must stay below 80% of max rating."""
    
    def __init__(self, max_duty_cycle: float = 0.8):
        super().__init__(
            constraint_id="FORMAL_009",
            name="actuator_duty_cycle",
            description=f"Continuous load must stay below {max_duty_cycle*100:.0f}% of max rating"
        )
        self.max_duty_cycle = max_duty_cycle
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        duty_cycle = design_data.get("actuator_duty_cycle")
        if duty_cycle is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_duty_cycle,
                evidence="Actuator duty cycle not provided in design data",
                confidence=0.0
            )
        
        margin = self.max_duty_cycle - duty_cycle
        satisfied = duty_cycle <= self.max_duty_cycle
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=duty_cycle,
            threshold=self.max_duty_cycle,
            margin=margin,
            evidence=f"Duty cycle {duty_cycle:.2%} {'<=' if satisfied else 'EXCEEDS'} limit {self.max_duty_cycle:.2%}",
            confidence=1.0
        )


class ResonanceMarginConstraint(FormalConstraint):
    """Operating frequency must be >20% away from structural natural frequency."""
    
    def __init__(self, min_margin_percent: float = 20.0):
        super().__init__(
            constraint_id="FORMAL_010",
            name="resonance_margin",
            description=f"Operating frequency must be >{min_margin_percent:.0f}% away from natural frequency"
        )
        self.min_margin_percent = min_margin_percent / 100.0
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        operating_freq_hz = design_data.get("operating_frequency_hz")
        natural_freq_hz = design_data.get("natural_frequency_hz")
        
        if operating_freq_hz is None or natural_freq_hz is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Operating frequency or natural frequency not provided",
                confidence=0.0
            )
        
        freq_ratio = abs(operating_freq_hz - natural_freq_hz) / natural_freq_hz
        margin = freq_ratio - self.min_margin_percent
        satisfied = freq_ratio > self.min_margin_percent
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=freq_ratio,
            threshold=self.min_margin_percent,
            margin=margin,
            evidence=f"Frequency margin {freq_ratio:.2%} {'>' if satisfied else '<='} required {self.min_margin_percent:.2%} (op: {operating_freq_hz:.1f} Hz, nat: {natural_freq_hz:.1f} Hz)",
            confidence=1.0
        )


class ThermalLimitConstraint(FormalConstraint):
    """Thermal envelope check: thermal_risk = power_density × duty_cycle × cooling_factor."""
    
    def __init__(self, max_power_w: float = 50.0, max_temperature_celsius: float = 70.0):
        super().__init__(
            constraint_id="FORMAL_011",
            name="thermal_limit",
            description=f"Thermal risk must not exceed limits (power: {max_power_w} W, temp: {max_temperature_celsius}°C)"
        )
        self.max_power_w = max_power_w
        self.max_temperature_celsius = max_temperature_celsius  # Safe operating temperature rise limit
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        # Check temperature rise first (most direct indicator)
        temperature_rise = design_data.get("temperature_rise_celsius") or design_data.get("estimated_temp_rise_c")
        if temperature_rise is not None:
            margin = self.max_temperature_celsius - temperature_rise
            satisfied = temperature_rise <= self.max_temperature_celsius
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
                value=temperature_rise,
                threshold=self.max_temperature_celsius,
                margin=margin,
                evidence=f"Temperature rise {temperature_rise:.1f}°C {'<=' if satisfied else 'EXCEEDS'} limit {self.max_temperature_celsius}°C",
                confidence=1.0
            )
        
        # Thermal envelope model: thermal_risk = power_density × duty_cycle × cooling_factor
        power_dissipation = design_data.get("power_dissipation_w") or design_data.get("motor_power_w") or design_data.get("effective_power_w")
        duty_cycle = design_data.get("duty_cycle") or design_data.get("actuator_duty_cycle")
        if duty_cycle is None:
            # Try to infer from percentage
            duty_cycle_percent = design_data.get("duty_cycle_percent") or design_data.get("utilization_percent")
            if duty_cycle_percent is not None:
                duty_cycle = duty_cycle_percent / 100.0
            else:
                duty_cycle = 1.0  # Default: continuous operation
        
        cooling_factor = design_data.get("cooling_factor", 1.0)  # Default: no cooling
        
        if power_dissipation is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_power_w,
                evidence="Power dissipation not provided in design data",
                confidence=0.0
            )
        
        # Calculate thermal risk
        thermal_risk = power_dissipation * duty_cycle * cooling_factor
        
        margin = self.max_power_w - thermal_risk
        satisfied = thermal_risk <= self.max_power_w
        
        evidence_parts = [f"Power: {power_dissipation:.2f} W"]
        if duty_cycle != 1.0:
            evidence_parts.append(f"Duty: {duty_cycle:.2%}")
        if cooling_factor != 1.0:
            evidence_parts.append(f"Cooling: {cooling_factor:.2f}x")
        evidence_parts.append(f"Risk: {thermal_risk:.2f} W")
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=thermal_risk,
            threshold=self.max_power_w,
            margin=margin,
            evidence=f"Thermal risk {'<=' if satisfied else 'EXCEEDS'} limit ({', '.join(evidence_parts)})",
            confidence=1.0
        )


class JointRangeLimitConstraint(FormalConstraint):
    """Commanded angles must stay within joint mechanical limits."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_012",
            name="joint_range_limit",
            description="Commanded angles must stay within joint mechanical limits"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        joints_within_limits = design_data.get("joints_within_limits")
        if joints_within_limits is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Joint range check not performed",
                confidence=0.0
            )
        
        if joints_within_limits:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                value=1.0,
                threshold=1.0,
                margin=1.0,
                evidence="All joints within mechanical limits",
                confidence=1.0
            )
        else:
            exceeded_joints = design_data.get("exceeded_joints", [])
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=0.0,
                threshold=1.0,
                margin=-1.0,
                evidence=f"Joint(s) exceed mechanical limits: {exceeded_joints}",
                confidence=1.0
            )


class PayloadRatioConstraint(FormalConstraint):
    """Payload must not exceed 70% of max rated payload (safety margin)."""
    
    def __init__(self, max_payload_ratio: float = 0.7):
        super().__init__(
            constraint_id="FORMAL_013",
            name="payload_ratio",
            description=f"Payload must not exceed {max_payload_ratio*100:.0f}% of max rated payload"
        )
        self.max_payload_ratio = max_payload_ratio
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        payload_kg = design_data.get("payload_kg")
        max_rated_payload_kg = design_data.get("max_rated_payload_kg")
        
        if payload_kg is None or max_rated_payload_kg is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_payload_ratio,
                evidence="Payload or max rated payload not provided",
                confidence=0.0
            )
        
        payload_ratio = payload_kg / max_rated_payload_kg
        margin = self.max_payload_ratio - payload_ratio
        satisfied = payload_ratio <= self.max_payload_ratio
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=payload_ratio,
            threshold=self.max_payload_ratio,
            margin=margin,
            evidence=f"Payload ratio {payload_ratio:.2%} {'<=' if satisfied else 'EXCEEDS'} limit {self.max_payload_ratio:.2%} ({payload_kg:.2f} kg / {max_rated_payload_kg:.2f} kg)",
            confidence=1.0
        )


class StiffnessMinimumConstraint(FormalConstraint):
    """End-effector stiffness must exceed minimum for task."""
    
    def __init__(self, min_stiffness_n_per_m: float = 1000.0):
        super().__init__(
            constraint_id="FORMAL_014",
            name="stiffness_minimum",
            description=f"End-effector stiffness must be >= {min_stiffness_n_per_m} N/m"
        )
        self.min_stiffness_n_per_m = min_stiffness_n_per_m
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        stiffness = design_data.get("end_effector_stiffness_n_per_m")
        if stiffness is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.min_stiffness_n_per_m,
                evidence="End-effector stiffness not provided in design data",
                confidence=0.0
            )
        
        margin = stiffness - self.min_stiffness_n_per_m
        satisfied = stiffness >= self.min_stiffness_n_per_m
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=stiffness,
            threshold=self.min_stiffness_n_per_m,
            margin=margin,
            evidence=f"Stiffness {stiffness:.2f} N/m {'>=' if satisfied else 'BELOW'} minimum {self.min_stiffness_n_per_m} N/m",
            confidence=1.0
        )


class VoltageLimitConstraint(FormalConstraint):
    """Motor voltage must not exceed driver max voltage."""
    
    def __init__(self, max_voltage_v: float = 24.0):
        super().__init__(
            constraint_id="FORMAL_015",
            name="voltage_limit",
            description=f"Motor voltage must not exceed {max_voltage_v} V"
        )
        self.max_voltage_v = max_voltage_v
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        max_voltage = design_data.get("max_voltage_v")
        if max_voltage is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_voltage_v,
                evidence="Max voltage not provided in design data",
                confidence=0.0
            )
        
        margin = self.max_voltage_v - max_voltage
        satisfied = max_voltage <= self.max_voltage_v
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=max_voltage,
            threshold=self.max_voltage_v,
            margin=margin,
            evidence=f"Voltage {max_voltage:.2f} V {'<=' if satisfied else 'EXCEEDS'} limit {self.max_voltage_v} V",
            confidence=1.0
        )


class ControlBandwidthMarginConstraint(FormalConstraint):
    """Control loop bandwidth must be >5x the task frequency."""
    
    def __init__(self, min_ratio: float = 5.0):
        super().__init__(
            constraint_id="FORMAL_016",
            name="control_bandwidth_margin",
            description=f"Control bandwidth must be >{min_ratio}x task frequency"
        )
        self.min_ratio = min_ratio
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        control_bandwidth = design_data.get("control_bandwidth_hz")
        task_frequency = design_data.get("task_frequency_hz")
        
        if control_bandwidth is None or task_frequency is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.min_ratio,
                evidence="Control bandwidth or task frequency not provided",
                confidence=0.0
            )
        
        ratio = control_bandwidth / task_frequency if task_frequency > 0 else 0
        margin = ratio - self.min_ratio
        satisfied = ratio > self.min_ratio
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=ratio,
            threshold=self.min_ratio,
            margin=margin,
            evidence=f"Bandwidth ratio {ratio:.2f} {'>' if satisfied else '<='} required {self.min_ratio} ({control_bandwidth} Hz / {task_frequency} Hz)",
            confidence=1.0
        )


class LatencyMarginConstraint(FormalConstraint):
    """Sensor-to-actuator latency must be <10% of control period."""
    
    def __init__(self, max_latency_ratio: float = 0.1):
        super().__init__(
            constraint_id="FORMAL_017",
            name="latency_margin",
            description=f"Control latency must be <{max_latency_ratio*100:.0f}% of control period"
        )
        self.max_latency_ratio = max_latency_ratio
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        control_latency = design_data.get("control_latency_ms") or design_data.get("sensor_latency_ms")
        control_period = design_data.get("control_period_ms") or design_data.get("control_loop_period_ms")
        
        if control_latency is None or control_period is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.max_latency_ratio,
                evidence="Control latency or period not provided",
                confidence=0.0
            )
        
        ratio = control_latency / control_period if control_period > 0 else 0
        margin = self.max_latency_ratio - ratio
        satisfied = ratio < self.max_latency_ratio
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=ratio,
            threshold=self.max_latency_ratio,
            margin=margin,
            evidence=f"Latency ratio {ratio:.3f} {'<' if satisfied else '>='} limit {self.max_latency_ratio} ({control_latency} ms / {control_period} ms)",
            confidence=1.0
        )


class PhaseMarginConstraint(FormalConstraint):
    """Phase margin must be >30°."""
    
    def __init__(self, min_phase_margin_deg: float = 30.0):
        super().__init__(
            constraint_id="FORMAL_018",
            name="phase_margin",
            description=f"Phase margin must be >{min_phase_margin_deg}°"
        )
        self.min_phase_margin_deg = min_phase_margin_deg
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        phase_margin = design_data.get("phase_margin_deg")
        
        if phase_margin is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.min_phase_margin_deg,
                evidence="Phase margin not provided",
                confidence=0.0
            )
        
        margin = phase_margin - self.min_phase_margin_deg
        satisfied = phase_margin > self.min_phase_margin_deg
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=phase_margin,
            threshold=self.min_phase_margin_deg,
            margin=margin,
            evidence=f"Phase margin {phase_margin:.1f}° {'>' if satisfied else '<='} minimum {self.min_phase_margin_deg}°",
            confidence=1.0
        )


class GainMarginConstraint(FormalConstraint):
    """Gain margin must be >6 dB."""
    
    def __init__(self, min_gain_margin_db: float = 6.0):
        super().__init__(
            constraint_id="FORMAL_019",
            name="gain_margin",
            description=f"Gain margin must be >{min_gain_margin_db} dB"
        )
        self.min_gain_margin_db = min_gain_margin_db
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        gain_margin = design_data.get("gain_margin_db")
        
        if gain_margin is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.min_gain_margin_db,
                evidence="Gain margin not provided",
                confidence=0.0
            )
        
        margin = gain_margin - self.min_gain_margin_db
        satisfied = gain_margin > self.min_gain_margin_db
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=gain_margin,
            threshold=self.min_gain_margin_db,
            margin=margin,
            evidence=f"Gain margin {gain_margin:.1f} dB {'>' if satisfied else '<='} minimum {self.min_gain_margin_db} dB",
            confidence=1.0
        )


class SamplingNyquistConstraint(FormalConstraint):
    """Sampling rate must be >2x highest relevant frequency."""
    
    def __init__(self, min_nyquist_ratio: float = 2.0):
        super().__init__(
            constraint_id="FORMAL_020",
            name="sampling_nyquist",
            description=f"Sampling rate must be >{min_nyquist_ratio}x highest frequency"
        )
        self.min_nyquist_ratio = min_nyquist_ratio
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        sampling_rate = design_data.get("sampling_rate_hz")
        max_frequency = design_data.get("max_signal_frequency_hz") or design_data.get("max_frequency_hz")
        
        if sampling_rate is None or max_frequency is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.min_nyquist_ratio,
                evidence="Sampling rate or max frequency not provided",
                confidence=0.0
            )
        
        ratio = sampling_rate / max_frequency if max_frequency > 0 else 0
        margin = ratio - self.min_nyquist_ratio
        satisfied = ratio > self.min_nyquist_ratio
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=ratio,
            threshold=self.min_nyquist_ratio,
            margin=margin,
            evidence=f"Nyquist ratio {ratio:.2f} {'>' if satisfied else '<='} required {self.min_nyquist_ratio} ({sampling_rate} Hz / {max_frequency} Hz)",
            confidence=1.0
        )


class EncoderResolutionConstraint(FormalConstraint):
    """Encoder resolution must provide at least 10x the required positioning accuracy."""
    
    def __init__(self, min_resolution_multiple: float = 10.0):
        super().__init__(
            constraint_id="FORMAL_021",
            name="encoder_resolution",
            description=f"Encoder resolution must be < required_accuracy / {min_resolution_multiple}"
        )
        self.min_resolution_multiple = min_resolution_multiple
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        encoder_resolution = design_data.get("encoder_resolution_m") or design_data.get("encoder_resolution_mm", 0) / 1000.0
        required_accuracy = design_data.get("required_accuracy_m") or design_data.get("required_precision_mm", 0) / 1000.0
        
        if encoder_resolution is None or encoder_resolution == 0 or required_accuracy is None or required_accuracy == 0:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Encoder resolution or required accuracy not provided",
                confidence=0.0
            )
        
        max_allowed_resolution = required_accuracy / self.min_resolution_multiple
        margin = max_allowed_resolution - encoder_resolution
        satisfied = encoder_resolution <= max_allowed_resolution
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=encoder_resolution,
            threshold=max_allowed_resolution,
            margin=margin,
            evidence=f"Encoder resolution {encoder_resolution*1000:.3f} mm {'<=' if satisfied else '>'} allowed {max_allowed_resolution*1000:.3f} mm (required accuracy: {required_accuracy*1000:.3f} mm)",
            confidence=1.0
        )


class ControlEnergyBoundConstraint(FormalConstraint):
    """Control output energy must not exceed actuator energy capacity per cycle."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_022",
            name="control_energy_bound",
            description="Control energy per cycle must not exceed actuator capacity"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        control_energy = design_data.get("control_energy_per_cycle_j")
        actuator_capacity = design_data.get("actuator_energy_capacity_j")
        
        if control_energy is None or actuator_capacity is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Control energy or actuator capacity not provided",
                confidence=0.0
            )
        
        margin = actuator_capacity - control_energy
        satisfied = control_energy <= actuator_capacity
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=control_energy,
            threshold=actuator_capacity,
            margin=margin,
            evidence=f"Control energy {control_energy:.3f} J {'<=' if satisfied else 'EXCEEDS'} capacity {actuator_capacity:.3f} J",
            confidence=1.0
        )


class FatigueSafetyFactorConstraint(FormalConstraint):
    """Applied cyclic stress must be below endurance limit with safety factor 2.0."""
    
    def __init__(self, safety_factor: float = 2.0):
        super().__init__(
            constraint_id="FORMAL_023",
            name="fatigue_safety_factor",
            description=f"Cyclic stress must be < endurance_limit / {safety_factor}"
        )
        self.safety_factor = safety_factor
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        cyclic_stress = design_data.get("cyclic_stress_mpa") or design_data.get("stress_amplitude_mpa")
        endurance_limit = design_data.get("endurance_limit_mpa")
        
        if cyclic_stress is None or endurance_limit is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Cyclic stress or endurance limit not provided",
                confidence=0.0
            )
        
        max_allowed_stress = endurance_limit / self.safety_factor
        margin = max_allowed_stress - cyclic_stress
        satisfied = cyclic_stress <= max_allowed_stress
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=cyclic_stress,
            threshold=max_allowed_stress,
            margin=margin,
            evidence=f"Cyclic stress {cyclic_stress:.1f} MPa {'<=' if satisfied else 'EXCEEDS'} allowed {max_allowed_stress:.1f} MPa (endurance limit: {endurance_limit:.1f} MPa)",
            confidence=1.0
        )


class CreepRiskConstraint(FormalConstraint):
    """Sustained stress at temperature must be below creep threshold."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_024",
            name="creep_risk",
            description="Sustained stress must be below creep threshold, temp < 0.4 × max_service_temp"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        sustained_stress = design_data.get("sustained_stress_mpa")
        creep_threshold = design_data.get("creep_threshold_mpa")
        operating_temp = design_data.get("operating_temp_c") or design_data.get("operating_temp_celsius")
        max_service_temp = design_data.get("max_service_temp_c") or design_data.get("melting_temp_c")
        
        if sustained_stress is None or creep_threshold is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Sustained stress or creep threshold not provided",
                confidence=0.0
            )
        
        # Check stress
        stress_margin = creep_threshold - sustained_stress
        stress_satisfied = sustained_stress <= creep_threshold
        
        # Check temperature (convert to Kelvin for ratio)
        temp_satisfied = True
        temp_margin = None
        if operating_temp is not None and max_service_temp is not None:
            temp_k_operating = operating_temp + 273.15
            temp_k_max = max_service_temp + 273.15
            max_allowed_temp_ratio = 0.4
            temp_ratio = temp_k_operating / temp_k_max if temp_k_max > 0 else 0
            temp_satisfied = temp_ratio <= max_allowed_temp_ratio
            temp_margin = max_allowed_temp_ratio - temp_ratio
        
        satisfied = stress_satisfied and temp_satisfied
        
        evidence_parts = []
        if not stress_satisfied:
            evidence_parts.append(f"Stress {sustained_stress:.1f} MPa EXCEEDS creep threshold {creep_threshold:.1f} MPa")
        else:
            evidence_parts.append(f"Stress OK ({sustained_stress:.1f} <= {creep_threshold:.1f} MPa)")
        
        if operating_temp is not None and max_service_temp is not None:
            if not temp_satisfied:
                evidence_parts.append(f"Temp ratio {temp_ratio:.2f} EXCEEDS 0.4")
            else:
                evidence_parts.append(f"Temp OK ({temp_ratio:.2f} <= 0.4)")
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=sustained_stress,
            threshold=creep_threshold,
            margin=stress_margin,
            evidence="; ".join(evidence_parts),
            confidence=1.0
        )


class StressCorrosionRiskConstraint(FormalConstraint):
    """Tensile stress in corrosive environment must be below SCC threshold."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_025",
            name="stress_corrosion_risk",
            description="Tensile stress in corrosive environment must be < SCC threshold"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        tensile_stress = design_data.get("tensile_stress_mpa") or design_data.get("operating_stress_mpa")
        scc_threshold = design_data.get("scc_threshold_mpa")
        corrosive_env = design_data.get("corrosive_environment")
        
        if tensile_stress is None or scc_threshold is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Tensile stress or SCC threshold not provided",
                confidence=0.0
            )
        
        if corrosive_env is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Corrosive environment status not provided",
                confidence=0.0
            )
        
        if not corrosive_env:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED,
                value=tensile_stress,
                threshold=scc_threshold,
                margin=scc_threshold - tensile_stress,
                evidence="Not in corrosive environment - SCC risk not applicable",
                confidence=1.0
            )
        
        margin = scc_threshold - tensile_stress
        satisfied = tensile_stress <= scc_threshold
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=tensile_stress,
            threshold=scc_threshold,
            margin=margin,
            evidence=f"In corrosive environment: tensile stress {tensile_stress:.1f} MPa {'<=' if satisfied else 'EXCEEDS'} SCC threshold {scc_threshold:.1f} MPa",
            confidence=1.0
        )


class UVDegradationRiskConstraint(FormalConstraint):
    """Polymer exposure hours must be below rated UV life."""
    
    def __init__(self, safety_factor: float = 0.8):
        super().__init__(
            constraint_id="FORMAL_026",
            name="uv_degradation_risk",
            description=f"UV exposure must be < {safety_factor*100:.0f}% of rated UV life"
        )
        self.safety_factor = safety_factor
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        uv_exposure = design_data.get("uv_exposure_hours")
        uv_rated_life = design_data.get("uv_rated_life_hours")
        
        if uv_exposure is None or uv_rated_life is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="UV exposure hours or rated life not provided",
                confidence=0.0
            )
        
        max_allowed_exposure = uv_rated_life * self.safety_factor
        margin = max_allowed_exposure - uv_exposure
        satisfied = uv_exposure <= max_allowed_exposure
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=uv_exposure,
            threshold=max_allowed_exposure,
            margin=margin,
            evidence=f"UV exposure {uv_exposure:.0f} hours {'<=' if satisfied else 'EXCEEDS'} allowed {max_allowed_exposure:.0f} hours ({self.safety_factor*100:.0f}% of rated {uv_rated_life:.0f} hours)",
            confidence=1.0
        )


class SafetyFactorStaticConstraint(FormalConstraint):
    """Applied stress must be below yield strength / safety factor (2.0)."""
    
    def __init__(self, safety_factor: float = 2.0):
        super().__init__(
            constraint_id="FORMAL_027",
            name="safety_factor_static",
            description=f"Applied stress must be < yield_strength / {safety_factor}"
        )
        self.safety_factor = safety_factor
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        applied_stress = design_data.get("applied_stress_mpa") or design_data.get("operating_stress_mpa") or design_data.get("von_mises_mpa")
        yield_strength = design_data.get("yield_strength_mpa") or design_data.get("yield_strength_mpa")
        
        if applied_stress is None or yield_strength is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Applied stress or yield strength not provided",
                confidence=0.0
            )
        
        max_allowed_stress = yield_strength / self.safety_factor
        margin = max_allowed_stress - applied_stress
        satisfied = applied_stress <= max_allowed_stress
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=applied_stress,
            threshold=max_allowed_stress,
            margin=margin,
            evidence=f"Applied stress {applied_stress:.1f} MPa {'<=' if satisfied else 'EXCEEDS'} allowed {max_allowed_stress:.1f} MPa (yield: {yield_strength:.1f} MPa, SF: {self.safety_factor})",
            confidence=1.0
        )


class StiffnessMismatchConstraint(FormalConstraint):
    """Stiffness ratio between mating parts must be < 5x."""
    
    def __init__(self, max_ratio: float = 5.0):
        super().__init__(
            constraint_id="FORMAL_028",
            name="stiffness_mismatch",
            description=f"Stiffness ratio between parts must be < {max_ratio}x"
        )
        self.max_ratio = max_ratio
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        stiffness_a = design_data.get("stiffness_part_a_npm") or design_data.get("part1_stiffness_n_per_m")
        stiffness_b = design_data.get("stiffness_part_b_npm") or design_data.get("part2_stiffness_n_per_m")
        
        if stiffness_a is None or stiffness_b is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Stiffness values not provided",
                confidence=0.0
            )
        
        if stiffness_a == 0 or stiffness_b == 0:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Zero stiffness value",
                confidence=0.0
            )
        
        ratio = max(stiffness_a, stiffness_b) / min(stiffness_a, stiffness_b)
        margin = self.max_ratio - ratio
        satisfied = ratio <= self.max_ratio
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=ratio,
            threshold=self.max_ratio,
            margin=margin,
            evidence=f"Stiffness ratio {ratio:.2f}x {'<=' if satisfied else 'EXCEEDS'} limit {self.max_ratio}x ({max(stiffness_a, stiffness_b):.1f} / {min(stiffness_a, stiffness_b):.1f} N/m)",
            confidence=1.0
        )


class CreepEnvelopeConstraint(FormalConstraint):
    """Creep risk envelope: creep_risk = stress_ratio × temperature_factor × time_hours."""
    
    def __init__(self, max_creep_risk: float = 0.5):
        super().__init__(
            constraint_id="FORMAL_029",
            name="creep_envelope",
            description=f"Creep risk must be < {max_creep_risk} (conservative)"
        )
        self.max_creep_risk = max_creep_risk
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        sustained_stress = design_data.get("sustained_stress_mpa")
        yield_strength = design_data.get("yield_strength_mpa")
        operating_temp = design_data.get("operating_temp_c") or design_data.get("operating_temp_celsius")
        max_service_temp = design_data.get("max_service_temp_c") or design_data.get("melting_temp_c")
        exposure_hours = design_data.get("exposure_hours") or design_data.get("expected_life_hours", 0)
        
        if sustained_stress is None or yield_strength is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Sustained stress or yield strength not provided",
                confidence=0.0
            )
        
        # Calculate creep risk
        stress_ratio = sustained_stress / yield_strength if yield_strength > 0 else 0
        
        if operating_temp is not None and max_service_temp is not None:
            temp_k_operating = operating_temp + 273.15
            temp_k_max = max_service_temp + 273.15
            temperature_factor = temp_k_operating / temp_k_max if temp_k_max > 0 else 0
        else:
            temperature_factor = 0.5  # Default moderate temperature
        
        time_factor = min(exposure_hours / 8760.0, 1.0)  # Normalize to years, cap at 1.0
        
        creep_risk = stress_ratio * temperature_factor * time_factor
        
        margin = self.max_creep_risk - creep_risk
        satisfied = creep_risk <= self.max_creep_risk
        
        evidence_parts = [f"Stress ratio: {stress_ratio:.2f}"]
        if operating_temp is not None:
            evidence_parts.append(f"Temp factor: {temperature_factor:.2f}")
        evidence_parts.append(f"Time factor: {time_factor:.2f}")
        evidence_parts.append(f"Creep risk: {creep_risk:.3f}")
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=creep_risk,
            threshold=self.max_creep_risk,
            margin=margin,
            evidence=f"Creep risk {'<=' if satisfied else 'EXCEEDS'} limit ({', '.join(evidence_parts)})",
            confidence=1.0
        )


class ThermalMaterialCouplingConstraint(FormalConstraint):
    """At elevated temp, reduce allowable stress: effective_allowable = yield × (1 - 0.5 × (temp/max_temp)²)."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_030",
            name="thermal_material_coupling",
            description="Effective allowable stress reduced at elevated temperature"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        applied_stress = design_data.get("applied_stress_mpa") or design_data.get("von_mises_mpa")
        yield_strength = design_data.get("yield_strength_mpa")
        operating_temp = design_data.get("operating_temp_c") or design_data.get("operating_temp_celsius")
        max_service_temp = design_data.get("max_service_temp_c") or design_data.get("melting_temp_c")
        
        if applied_stress is None or yield_strength is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Applied stress or yield strength not provided",
                confidence=0.0
            )
        
        if operating_temp is None or max_service_temp is None:
            # No temperature effect
            temp_factor = 1.0
            effective_allowable = yield_strength
        else:
            temp_ratio = operating_temp / max_service_temp if max_service_temp > 0 else 0
            temp_factor = 1.0 - 0.5 * (temp_ratio ** 2)
            effective_allowable = yield_strength * temp_factor
        
        margin = effective_allowable - applied_stress
        satisfied = applied_stress <= effective_allowable
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=applied_stress,
            threshold=effective_allowable,
            margin=margin,
            evidence=f"Applied stress {applied_stress:.1f} MPa {'<=' if satisfied else 'EXCEEDS'} effective allowable {effective_allowable:.1f} MPa (yield: {yield_strength:.1f} MPa, temp factor: {temp_factor:.2f})",
            confidence=1.0
        )


class ContactPressureConstraint(FormalConstraint):
    """Contact pressure must not exceed material limit."""
    
    def __init__(self, default_limit_mpa: float = 1.0):
        super().__init__(
            constraint_id="FORMAL_031",
            name="contact_pressure",
            description=f"Contact pressure must not exceed limit (default: {default_limit_mpa} MPa for soft tissue)"
        )
        self.default_limit_mpa = default_limit_mpa
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        contact_force = design_data.get("contact_force_n")
        contact_area = design_data.get("contact_area_mm2")
        pressure_limit = design_data.get("pressure_limit_mpa", self.default_limit_mpa)
        
        if contact_force is None or contact_area is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=pressure_limit,
                evidence="Contact force or area not provided",
                confidence=0.0
            )
        
        if contact_area <= 0:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Invalid contact area (zero or negative)",
                confidence=0.0
            )
        
        pressure_mpa = (contact_force / contact_area) * 1000.0  # Convert N/mm² to MPa
        margin = pressure_limit - pressure_mpa
        satisfied = pressure_mpa <= pressure_limit
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=pressure_mpa,
            threshold=pressure_limit,
            margin=margin,
            evidence=f"Contact pressure {pressure_mpa:.2f} MPa {'<=' if satisfied else 'EXCEEDS'} limit {pressure_limit:.2f} MPa ({contact_force:.1f} N / {contact_area:.1f} mm²)",
            confidence=1.0
        )


class TissueCrushRiskConstraint(FormalConstraint):
    """Tissue crush risk: pressure > tolerance AND duration > threshold."""
    
    def __init__(self, tissue_tolerance_mpa: float = 0.5, duration_threshold_s: float = 1.0):
        super().__init__(
            constraint_id="FORMAL_032",
            name="tissue_crush_risk",
            description=f"Tissue crush risk: pressure > {tissue_tolerance_mpa} MPa AND duration > {duration_threshold_s} s"
        )
        self.tissue_tolerance_mpa = tissue_tolerance_mpa
        self.duration_threshold_s = duration_threshold_s
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        contact_force = design_data.get("contact_force_n")
        contact_area = design_data.get("contact_area_mm2")
        tissue_tolerance = design_data.get("tissue_tolerance_mpa", self.tissue_tolerance_mpa)
        contact_duration = design_data.get("contact_duration_s", 0)
        
        if contact_force is None or contact_area is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Contact force or area not provided",
                confidence=0.0
            )
        
        if contact_area <= 0:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Invalid contact area",
                confidence=0.0
            )
        
        pressure_mpa = (contact_force / contact_area) * 1000.0
        pressure_exceeds = pressure_mpa > tissue_tolerance
        duration_exceeds = contact_duration > self.duration_threshold_s
        
        satisfied = not (pressure_exceeds and duration_exceeds)
        
        if satisfied:
            margin = min(tissue_tolerance - pressure_mpa, self.duration_threshold_s - contact_duration)
        else:
            margin = -max(pressure_mpa - tissue_tolerance, contact_duration - self.duration_threshold_s)
        
        evidence_parts = []
        if pressure_exceeds:
            evidence_parts.append(f"Pressure {pressure_mpa:.2f} MPa > tolerance {tissue_tolerance:.2f} MPa")
        if duration_exceeds:
            evidence_parts.append(f"Duration {contact_duration:.1f} s > threshold {self.duration_threshold_s:.1f} s")
        if satisfied:
            evidence_parts.append("Risk condition not met")
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=pressure_mpa,
            threshold=tissue_tolerance,
            margin=margin,
            evidence="; ".join(evidence_parts) if evidence_parts else "No crush risk",
            confidence=1.0
        )


class BoltShearConstraint(FormalConstraint):
    """Bolt shear stress must be below strength / safety factor."""
    
    def __init__(self, safety_factor: float = 2.0):
        super().__init__(
            constraint_id="FORMAL_033",
            name="bolt_shear",
            description=f"Bolt shear stress must be < shear_strength / {safety_factor}"
        )
        self.safety_factor = safety_factor
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        joint_force = design_data.get("joint_force_n")
        n_bolts = design_data.get("n_bolts", 1)
        bolt_diameter = design_data.get("bolt_diameter_mm")
        bolt_shear_strength = design_data.get("bolt_shear_strength_mpa")
        
        if joint_force is None or bolt_diameter is None or bolt_shear_strength is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Joint force, bolt diameter, or shear strength not provided",
                confidence=0.0
            )
        
        bolt_area_mm2 = 3.14159 * (bolt_diameter / 2.0) ** 2
        total_area_mm2 = bolt_area_mm2 * n_bolts
        shear_stress_mpa = (joint_force / total_area_mm2) * 1000.0 if total_area_mm2 > 0 else 0
        
        max_allowed_stress = bolt_shear_strength / self.safety_factor
        margin = max_allowed_stress - shear_stress_mpa
        satisfied = shear_stress_mpa <= max_allowed_stress
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=shear_stress_mpa,
            threshold=max_allowed_stress,
            margin=margin,
            evidence=f"Shear stress {shear_stress_mpa:.1f} MPa {'<=' if satisfied else 'EXCEEDS'} allowed {max_allowed_stress:.1f} MPa ({joint_force:.1f} N / {n_bolts} bolts, {bolt_diameter:.1f} mm)",
            confidence=1.0
        )


class AdhesiveLoadConstraint(FormalConstraint):
    """Adhesive bond stress must be below strength / safety factor."""
    
    def __init__(self, safety_factor: float = 3.0):
        super().__init__(
            constraint_id="FORMAL_034",
            name="adhesive_load",
            description=f"Adhesive bond stress must be < adhesive_strength / {safety_factor}"
        )
        self.safety_factor = safety_factor
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        joint_force = design_data.get("joint_force_n")
        bond_area = design_data.get("bond_area_mm2")
        adhesive_strength = design_data.get("adhesive_strength_mpa")
        
        if joint_force is None or bond_area is None or adhesive_strength is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Joint force, bond area, or adhesive strength not provided",
                confidence=0.0
            )
        
        if bond_area <= 0:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Invalid bond area",
                confidence=0.0
            )
        
        bond_stress_mpa = (joint_force / bond_area) * 1000.0
        max_allowed_stress = adhesive_strength / self.safety_factor
        margin = max_allowed_stress - bond_stress_mpa
        satisfied = bond_stress_mpa <= max_allowed_stress
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=bond_stress_mpa,
            threshold=max_allowed_stress,
            margin=margin,
            evidence=f"Bond stress {bond_stress_mpa:.2f} MPa {'<=' if satisfied else 'EXCEEDS'} allowed {max_allowed_stress:.2f} MPa ({joint_force:.1f} N / {bond_area:.1f} mm²)",
            confidence=1.0
        )


class SlipMarginConstraint(FormalConstraint):
    """Applied tangential force must be < friction force × margin (30%)."""
    
    def __init__(self, margin_ratio: float = 0.7):
        super().__init__(
            constraint_id="FORMAL_035",
            name="slip_margin",
            description=f"Tangential force must be < friction_force × {margin_ratio} ({1-margin_ratio:.0%} margin)"
        )
        self.margin_ratio = margin_ratio
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        normal_force = design_data.get("normal_force_n")
        friction_coeff = design_data.get("friction_coefficient") or design_data.get("friction_coeff")
        tangential_force = design_data.get("tangential_force_n") or design_data.get("grip_force_n")
        
        if normal_force is None or friction_coeff is None or tangential_force is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Normal force, friction coefficient, or tangential force not provided",
                confidence=0.0
            )
        
        friction_force = normal_force * friction_coeff
        max_allowed_tangential = friction_force * self.margin_ratio
        margin = max_allowed_tangential - tangential_force
        satisfied = tangential_force <= max_allowed_tangential
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=tangential_force,
            threshold=max_allowed_tangential,
            margin=margin,
            evidence=f"Tangential force {tangential_force:.2f} N {'<=' if satisfied else 'EXCEEDS'} allowed {max_allowed_tangential:.2f} N (friction: {friction_force:.2f} N, μ={friction_coeff:.2f})",
            confidence=1.0
        )


class CorrosionRateConstraint(FormalConstraint):
    """Wall loss from corrosion must be < 50% of wall thickness."""
    
    def __init__(self, max_wall_loss_ratio: float = 0.5):
        super().__init__(
            constraint_id="FORMAL_036",
            name="corrosion_rate",
            description=f"Corrosion wall loss must be < {max_wall_loss_ratio*100:.0f}% of wall thickness"
        )
        self.max_wall_loss_ratio = max_wall_loss_ratio
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        corrosion_rate = design_data.get("corrosion_rate_mm_yr") or design_data.get("corrosion_rate_mm_per_year")
        service_life = design_data.get("service_life_years")
        wall_thickness = design_data.get("wall_thickness_mm")
        
        if corrosion_rate is None or service_life is None or wall_thickness is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Corrosion rate, service life, or wall thickness not provided",
                confidence=0.0
            )
        
        wall_loss_mm = corrosion_rate * service_life
        max_allowed_loss = wall_thickness * self.max_wall_loss_ratio
        margin = max_allowed_loss - wall_loss_mm
        satisfied = wall_loss_mm <= max_allowed_loss
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=wall_loss_mm,
            threshold=max_allowed_loss,
            margin=margin,
            evidence=f"Wall loss {wall_loss_mm:.2f} mm {'<=' if satisfied else 'EXCEEDS'} allowed {max_allowed_loss:.2f} mm ({corrosion_rate:.3f} mm/yr × {service_life:.1f} years, wall: {wall_thickness:.2f} mm)",
            confidence=1.0
        )


class ToleranceStackLimitConstraint(FormalConstraint):
    """Tolerance stack-up must not exceed clearance budget."""
    
    def __init__(self, min_clearance_mm: float = 1.0):
        super().__init__(
            constraint_id="FORMAL_037",
            name="tolerance_stack_limit",
            description=f"Tolerance stack-up must leave at least {min_clearance_mm} mm clearance"
        )
        self.min_clearance_mm = min_clearance_mm
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        if tolerance_stack_analysis is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Geometry probe not available",
                confidence=0.0
            )
        
        parts_data = design_data.get("parts")
        assembly_clearance = design_data.get("assembly_clearance_mm")
        
        if parts_data is None or assembly_clearance is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                threshold=self.min_clearance_mm,
                evidence="Parts list or assembly clearance not provided",
                confidence=0.0
            )
        
        # Convert parts data to PartTolerance objects
        parts = []
        for part_data in parts_data:
            if isinstance(part_data, dict):
                parts.append(PartTolerance(
                    nominal_dim_mm=part_data.get("nominal_dim_mm", 0.0),
                    tolerance_mm=part_data.get("tolerance_mm", 0.0),
                    count=part_data.get("count", 1)
                ))
        
        if not parts:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="No parts specified",
                confidence=0.0
            )
        
        analysis = tolerance_stack_analysis(parts, assembly_clearance)
        worst_case_clearance = analysis["worst_case_clearance_remaining_mm"]
        margin = worst_case_clearance - self.min_clearance_mm
        satisfied = worst_case_clearance >= self.min_clearance_mm
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=worst_case_clearance,
            threshold=self.min_clearance_mm,
            margin=margin,
            evidence=f"Worst-case clearance {worst_case_clearance:.3f} mm {'>=' if satisfied else '<'} minimum {self.min_clearance_mm} mm",
            confidence=1.0
        )


class ThermalExpansionClearanceConstraint(FormalConstraint):
    """Thermal expansion must not close clearance below minimum."""
    
    def __init__(self, min_clearance_mm: float = 1.0):
        super().__init__(
            constraint_id="FORMAL_038",
            name="thermal_expansion_clearance",
            description=f"Thermal expansion must leave at least {min_clearance_mm} mm clearance"
        )
        self.min_clearance_mm = min_clearance_mm
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        if thermal_expansion_mismatch is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Geometry probe not available",
                confidence=0.0
            )
        
        # Single part expansion
        material_cte = design_data.get("material_cte")
        part_length_mm = design_data.get("part_length_mm")
        delta_temp_c = design_data.get("delta_temp_c")
        initial_clearance_mm = design_data.get("initial_clearance_mm")
        
        # Two-part mismatch
        part1_cte = design_data.get("part1_cte")
        part1_length_mm = design_data.get("part1_length_mm")
        part2_cte = design_data.get("part2_cte")
        part2_length_mm = design_data.get("part2_length_mm")
        
        if part1_cte is not None and part2_cte is not None:
            # Two-part mismatch case
            if part1_length_mm is None or part2_length_mm is None or delta_temp_c is None or initial_clearance_mm is None:
                return ConstraintCheckResult(
                    constraint_id=self.constraint_id,
                    constraint_name=self.name,
                    result=CheckResult.UNKNOWN,
                    evidence="Two-part thermal expansion data incomplete",
                    confidence=0.0
                )
            
            analysis = thermal_expansion_mismatch(
                part1_cte, part1_length_mm,
                part2_cte, part2_length_mm,
                delta_temp_c, initial_clearance_mm
            )
            clearance_after = analysis["clearance_after_thermal_mm"]
        elif material_cte is not None and part_length_mm is not None and delta_temp_c is not None:
            # Single part expansion
            expansion = thermal_dimensional_change(material_cte, part_length_mm, delta_temp_c)
            initial_clearance_mm = design_data.get("initial_clearance_mm", 0.0)
            clearance_after = initial_clearance_mm - expansion
        else:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Thermal expansion data not provided",
                confidence=0.0
            )
        
        margin = clearance_after - self.min_clearance_mm
        satisfied = clearance_after >= self.min_clearance_mm
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=clearance_after,
            threshold=self.min_clearance_mm,
            margin=margin,
            evidence=f"Clearance after thermal expansion {clearance_after:.3f} mm {'>=' if satisfied else '<'} minimum {self.min_clearance_mm} mm",
            confidence=1.0
        )


class DeflectionClearanceConstraint(FormalConstraint):
    """Deflection under load must not reduce clearance below minimum."""
    
    def __init__(self, min_clearance_mm: float = 1.0):
        super().__init__(
            constraint_id="FORMAL_039",
            name="deflection_clearance",
            description=f"Deflection must leave at least {min_clearance_mm} mm clearance"
        )
        self.min_clearance_mm = min_clearance_mm
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        if deflection_clearance_loss is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Geometry probe not available",
                confidence=0.0
            )
        
        force_n = design_data.get("applied_force_n")
        length_mm = design_data.get("beam_length_mm")
        EI_nmm2 = design_data.get("EI_nmm2")
        initial_clearance_mm = design_data.get("initial_clearance_mm")
        
        if force_n is None or length_mm is None or EI_nmm2 is None or initial_clearance_mm is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Deflection data not provided",
                confidence=0.0
            )
        
        analysis = deflection_clearance_loss(force_n, length_mm, EI_nmm2, initial_clearance_mm)
        remaining_clearance = analysis["remaining_clearance_mm"]
        margin = remaining_clearance - self.min_clearance_mm
        satisfied = remaining_clearance >= self.min_clearance_mm
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=remaining_clearance,
            threshold=self.min_clearance_mm,
            margin=margin,
            evidence=f"Remaining clearance after deflection {remaining_clearance:.3f} mm {'>=' if satisfied else '<'} minimum {self.min_clearance_mm} mm",
            confidence=1.0
        )


class AssemblyErrorBudgetConstraint(FormalConstraint):
    """Assembly error propagation must not exceed budget."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_040",
            name="assembly_error_budget",
            description="Assembly error propagation must not exceed budget"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        if assembly_error_propagation is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Geometry probe not available",
                confidence=0.0
            )
        
        stages_data = design_data.get("assembly_stages")
        error_budget_mm = design_data.get("error_budget_mm")
        
        if stages_data is None or error_budget_mm is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Assembly stages or error budget not provided",
                confidence=0.0
            )
        
        if not isinstance(stages_data, list):
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Assembly stages must be a list",
                confidence=0.0
            )
        
        stages = []
        for stage_data in stages_data:
            if isinstance(stage_data, dict):
                stages.append(AssemblyStage(
                    positioning_error_mm=stage_data.get("positioning_error_mm", 0.0),
                    stage_name=stage_data.get("stage_name", "")
                ))
        
        if not stages:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="No assembly stages specified",
                confidence=0.0
            )
        
        analysis = assembly_error_propagation(stages, error_budget_mm)
        total_error = analysis["total_assembly_error_mm"]
        exceeds = analysis["exceeds_budget"]
        margin = error_budget_mm - total_error
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_VIOLATED if exceeds else CheckResult.PROVEN_SATISFIED,
            value=total_error,
            threshold=error_budget_mm,
            margin=margin,
            evidence=f"Total assembly error {total_error:.3f} mm {'EXCEEDS' if exceeds else '<='} budget {error_budget_mm:.3f} mm",
            confidence=1.0
        )


class DimensionalEnvelopeConstraint(FormalConstraint):
    """Combined tolerance stack + thermal expansion + deflection envelope."""
    
    def __init__(self, min_clearance_mm: float = 1.0):
        super().__init__(
            constraint_id="FORMAL_041",
            name="dimensional_envelope",
            description=f"Combined dimensional effects must leave at least {min_clearance_mm} mm clearance"
        )
        self.min_clearance_mm = min_clearance_mm
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        initial_clearance = design_data.get("initial_clearance_mm")
        if initial_clearance is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Initial clearance not provided",
                confidence=0.0
            )
        
        clearance_loss = 0.0
        
        # Tolerance stack loss
        if tolerance_stack_analysis is not None:
            parts_data = design_data.get("parts")
            if parts_data:
                parts = []
                for part_data in parts_data:
                    if isinstance(part_data, dict):
                        parts.append(PartTolerance(
                            nominal_dim_mm=part_data.get("nominal_dim_mm", 0.0),
                            tolerance_mm=part_data.get("tolerance_mm", 0.0),
                            count=part_data.get("count", 1)
                        ))
                if parts:
                    analysis = tolerance_stack_analysis(parts, initial_clearance)
                    clearance_loss += (initial_clearance - analysis["worst_case_clearance_remaining_mm"])
        
        # Thermal expansion loss
        if thermal_expansion_mismatch is not None:
            part1_cte = design_data.get("part1_cte")
            part2_cte = design_data.get("part2_cte")
            if part1_cte is not None and part2_cte is not None:
                part1_length_mm = design_data.get("part1_length_mm", 0.0)
                part2_length_mm = design_data.get("part2_length_mm", 0.0)
                delta_temp_c = design_data.get("delta_temp_c", 0.0)
                analysis = thermal_expansion_mismatch(
                    part1_cte, part1_length_mm,
                    part2_cte, part2_length_mm,
                    delta_temp_c, initial_clearance
                )
                clearance_loss += analysis["net_mismatch_mm"]
            elif design_data.get("material_cte") is not None:
                expansion = thermal_dimensional_change(
                    design_data.get("material_cte"),
                    design_data.get("part_length_mm", 0.0),
                    design_data.get("delta_temp_c", 0.0)
                )
                clearance_loss += expansion
        
        # Deflection loss
        if deflection_clearance_loss is not None:
            force_n = design_data.get("applied_force_n")
            length_mm = design_data.get("beam_length_mm")
            EI_nmm2 = design_data.get("EI_nmm2")
            if force_n is not None and length_mm is not None and EI_nmm2 is not None:
                analysis = deflection_clearance_loss(force_n, length_mm, EI_nmm2, initial_clearance)
                clearance_loss += analysis["deflection_mm"]
        
        remaining_clearance = initial_clearance - clearance_loss
        margin = remaining_clearance - self.min_clearance_mm
        satisfied = remaining_clearance >= self.min_clearance_mm
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=remaining_clearance,
            threshold=self.min_clearance_mm,
            margin=margin,
            evidence=f"Net clearance after all dimensional effects {remaining_clearance:.3f} mm {'>=' if satisfied else '<'} minimum {self.min_clearance_mm} mm",
            confidence=1.0
        )


class TrajectoryClearanceConstraint(FormalConstraint):
    """Minimum clearance over entire trajectory must meet threshold."""
    
    def __init__(self, min_clearance_threshold_mm: float = 1.0):
        super().__init__(
            constraint_id="FORMAL_042",
            name="trajectory_clearance",
            description=f"Minimum clearance over trajectory must be >= {min_clearance_threshold_mm} mm"
        )
        self.min_clearance_threshold_mm = min_clearance_threshold_mm
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        if trajectory_sweep_check is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Geometry probe not available",
                confidence=0.0
            )
        
        trajectory_clearances = design_data.get("trajectory_clearances")
        if trajectory_clearances is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Trajectory clearances not provided",
                confidence=0.0
            )
        
        if not isinstance(trajectory_clearances, list):
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Trajectory clearances must be a list",
                confidence=0.0
            )
        
        analysis = trajectory_sweep_check(trajectory_clearances, self.min_clearance_threshold_mm)
        min_clearance = analysis["min_clearance_over_trajectory"]
        violates = analysis["violates_threshold"]
        margin = min_clearance - self.min_clearance_threshold_mm
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_VIOLATED if violates else CheckResult.PROVEN_SATISFIED,
            value=min_clearance,
            threshold=self.min_clearance_threshold_mm,
            margin=margin,
            evidence=f"Minimum clearance over trajectory {min_clearance:.3f} mm {'<' if violates else '>='} threshold {self.min_clearance_threshold_mm} mm",
            confidence=1.0
        )


class BacklashAccumulationConstraint(FormalConstraint):
    """Backlash accumulation over cycles must not exceed positioning tolerance."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_043",
            name="backlash_accumulation",
            description="Backlash accumulation must not exceed positioning tolerance"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        backlash_per_cycle_mm = design_data.get("backlash_per_cycle_mm")
        n_cycles = design_data.get("n_cycles")
        positioning_tolerance_mm = design_data.get("positioning_tolerance_mm")
        
        if backlash_per_cycle_mm is None or n_cycles is None or positioning_tolerance_mm is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Backlash or positioning tolerance data not provided",
                confidence=0.0
            )
        
        total_backlash = backlash_per_cycle_mm * n_cycles
        margin = positioning_tolerance_mm - total_backlash
        satisfied = total_backlash <= positioning_tolerance_mm
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=total_backlash,
            threshold=positioning_tolerance_mm,
            margin=margin,
            evidence=f"Total backlash {total_backlash:.3f} mm ({backlash_per_cycle_mm:.4f} mm/cycle × {n_cycles} cycles) {'<=' if satisfied else 'EXCEEDS'} tolerance {positioning_tolerance_mm:.3f} mm",
            confidence=1.0
        )


class NarrowPassageConstraint(FormalConstraint):
    """Narrow passage must have sufficient width for required clearance."""
    
    def __init__(self, default_margin_mm: float = 0.5):
        super().__init__(
            constraint_id="FORMAL_044",
            name="narrow_passage",
            description=f"Narrow passage width must exceed required width by at least {default_margin_mm} mm"
        )
        self.default_margin_mm = default_margin_mm
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        min_passage_width = design_data.get("min_passage_width_mm")
        required_width = design_data.get("required_width_mm")
        passage_margin = design_data.get("passage_margin_mm", self.default_margin_mm)
        
        if min_passage_width is None or required_width is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Min passage width or required width not provided",
                confidence=0.0
            )
        
        margin = min_passage_width - required_width
        satisfied = margin >= passage_margin
        threshold = required_width + passage_margin
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=min_passage_width,
            threshold=threshold,
            margin=margin - passage_margin,
            evidence=f"Passage width {min_passage_width:.3f} mm {'>=' if satisfied else '<'} required {required_width:.3f} mm + margin {passage_margin:.3f} mm",
            confidence=1.0
        )


class PoseReachabilityConstraint(FormalConstraint):
    """Pose must be reachable with sufficient joint margin."""
    
    def __init__(self, min_joint_margin_deg: float = 5.0):
        super().__init__(
            constraint_id="FORMAL_045",
            name="pose_reachability",
            description=f"Pose must be IK feasible with joint margin >= {min_joint_margin_deg}°"
        )
        self.min_joint_margin_deg = min_joint_margin_deg
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        ik_feasible = design_data.get("ik_feasible")
        joint_margin = design_data.get("joint_margin_deg")
        collision_free = design_data.get("collision_free_approach", True)
        
        if ik_feasible is None and joint_margin is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="IK feasibility or joint margin not provided",
                confidence=0.0
            )
        
        # If ik_feasible is explicitly False, violated
        if ik_feasible is False:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_VIOLATED,
                value=0.0,
                threshold=self.min_joint_margin_deg,
                margin=-self.min_joint_margin_deg,
                evidence="IK solution not feasible",
                confidence=1.0
            )
        
        # Check joint margin
        if joint_margin is not None:
            satisfied = joint_margin >= self.min_joint_margin_deg
            margin = joint_margin - self.min_joint_margin_deg
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
                value=joint_margin,
                threshold=self.min_joint_margin_deg,
                margin=margin,
                evidence=f"Joint margin {joint_margin:.1f}° {'>=' if satisfied else '<'} minimum {self.min_joint_margin_deg}°",
                confidence=1.0
            )
        
        # If ik_feasible is True but no margin specified, assume satisfied
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED,
            value=self.min_joint_margin_deg,
            threshold=self.min_joint_margin_deg,
            margin=0.0,
            evidence="IK feasible (margin not specified)",
            confidence=0.8
        )


class ThermalGapClosureConstraint(FormalConstraint):
    """Thermal expansion must not close gap below zero."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_046",
            name="thermal_gap_closure",
            description="Thermal expansion must not close gap below zero"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        initial_gap = design_data.get("initial_gap_mm")
        thermal_expansion = design_data.get("thermal_expansion_mm")
        
        # If thermal_expansion not provided, compute from CTE
        if thermal_expansion is None:
            material_cte = design_data.get("material_cte")
            length_mm = design_data.get("length_mm")
            delta_temp_c = design_data.get("delta_temp_c")
            
            if material_cte is None or length_mm is None or delta_temp_c is None:
                return ConstraintCheckResult(
                    constraint_id=self.constraint_id,
                    constraint_name=self.name,
                    result=CheckResult.UNKNOWN,
                    evidence="Initial gap and thermal expansion data not provided",
                    confidence=0.0
                )
            
            if thermal_expansion_mismatch is not None:
                thermal_expansion = thermal_dimensional_change(material_cte, length_mm, delta_temp_c)
            else:
                return ConstraintCheckResult(
                    constraint_id=self.constraint_id,
                    constraint_name=self.name,
                    result=CheckResult.UNKNOWN,
                    evidence="Geometry probe not available",
                    confidence=0.0
                )
        
        if initial_gap is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Initial gap not provided",
                confidence=0.0
            )
        
        remaining_gap = initial_gap - thermal_expansion
        satisfied = remaining_gap >= 0.0
        margin = remaining_gap
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=remaining_gap,
            threshold=0.0,
            margin=margin,
            evidence=f"Remaining gap after thermal expansion {remaining_gap:.3f} mm {'>=' if satisfied else '<'} 0 mm (initial: {initial_gap:.3f} mm, expansion: {thermal_expansion:.3f} mm)",
            confidence=1.0
        )


class CumulativePositioningDriftConstraint(FormalConstraint):
    """Cumulative positioning drift must not exceed budget."""
    
    def __init__(self):
        super().__init__(
            constraint_id="FORMAL_047",
            name="cumulative_positioning_drift",
            description="Cumulative positioning drift must not exceed budget"
        )
    
    def check(self, design_data: Dict[str, Any]) -> ConstraintCheckResult:
        drift_per_cycle = design_data.get("drift_per_cycle_mm")
        n_cycles = design_data.get("n_cycles")
        positioning_budget = design_data.get("positioning_budget_mm")
        
        if drift_per_cycle is None or n_cycles is None or positioning_budget is None:
            return ConstraintCheckResult(
                constraint_id=self.constraint_id,
                constraint_name=self.name,
                result=CheckResult.UNKNOWN,
                evidence="Drift per cycle, number of cycles, or positioning budget not provided",
                confidence=0.0
            )
        
        total_drift = drift_per_cycle * n_cycles
        margin = positioning_budget - total_drift
        satisfied = total_drift <= positioning_budget
        
        return ConstraintCheckResult(
            constraint_id=self.constraint_id,
            constraint_name=self.name,
            result=CheckResult.PROVEN_SATISFIED if satisfied else CheckResult.PROVEN_VIOLATED,
            value=total_drift,
            threshold=positioning_budget,
            margin=margin,
            evidence=f"Total drift {total_drift:.3f} mm ({drift_per_cycle:.6f} mm/cycle × {n_cycles} cycles) {'<=' if satisfied else 'EXCEEDS'} budget {positioning_budget:.3f} mm",
            confidence=1.0
        )


class FormalConstraintChecker:
    """Checks design against formal constraints."""
    
    def __init__(self):
        self.constraints: List[FormalConstraint] = [
            MassLimitConstraint(),
            MaxForceConstraint(),
            MaxAccelerationConstraint(),
            MinClearanceConstraint(),
            SelfCollisionConstraint(),
            COGStabilityConstraint(),
            TorqueLimitConstraint(),
            JerkLimitConstraint(),
            ActuatorDutyCycleConstraint(),
            ResonanceMarginConstraint(),
            ThermalLimitConstraint(),
            JointRangeLimitConstraint(),
            PayloadRatioConstraint(),
            StiffnessMinimumConstraint(),
            VoltageLimitConstraint(),
            # Control stability constraints
            ControlBandwidthMarginConstraint(),
            LatencyMarginConstraint(),
            PhaseMarginConstraint(),
            GainMarginConstraint(),
            SamplingNyquistConstraint(),
            EncoderResolutionConstraint(),
            ControlEnergyBoundConstraint(),
            # Material degradation constraints
            FatigueSafetyFactorConstraint(),
            CreepRiskConstraint(),
            StressCorrosionRiskConstraint(),
            UVDegradationRiskConstraint(),
            SafetyFactorStaticConstraint(),
            StiffnessMismatchConstraint(),
            # Material-environment coupling
            CreepEnvelopeConstraint(),
            ThermalMaterialCouplingConstraint(),
            # Interaction constraints
            ContactPressureConstraint(),
            TissueCrushRiskConstraint(),
            # Joint/adhesive constraints
            BoltShearConstraint(),
            AdhesiveLoadConstraint(),
            # Friction/slip constraints
            SlipMarginConstraint(),
            # Corrosion constraints
            CorrosionRateConstraint(),
            # Geometry constraints
            ToleranceStackLimitConstraint(),
            ThermalExpansionClearanceConstraint(),
            DeflectionClearanceConstraint(),
            AssemblyErrorBudgetConstraint(),
            DimensionalEnvelopeConstraint(),
            TrajectoryClearanceConstraint(),
            BacklashAccumulationConstraint(),
            NarrowPassageConstraint(),
            PoseReachabilityConstraint(),
            ThermalGapClosureConstraint(),
            CumulativePositioningDriftConstraint()
        ]
    
    def check_all(self, design_data: Dict[str, Any]) -> List[ConstraintCheckResult]:
        """
        Check all formal constraints against design data.
        
        Args:
            design_data: Dictionary containing design parameters
            
        Returns:
            List of constraint check results
        """
        return [c.check(design_data) for c in self.constraints]
    
    def get_violations(self, design_data: Dict[str, Any]) -> List[ConstraintCheckResult]:
        """
        Get only proven violations.
        
        Args:
            design_data: Dictionary containing design parameters
            
        Returns:
            List of violated constraints
        """
        results = self.check_all(design_data)
        return [r for r in results if r.result == CheckResult.PROVEN_VIOLATED]
    
    def get_unknowns(self, design_data: Dict[str, Any]) -> List[ConstraintCheckResult]:
        """
        Get constraints that cannot be checked (missing data).
        
        Args:
            design_data: Dictionary containing design parameters
            
        Returns:
            List of unknown constraints
        """
        results = self.check_all(design_data)
        return [r for r in results if r.result == CheckResult.UNKNOWN]
    
    def to_dict(self, results: List[ConstraintCheckResult]) -> Dict:
        """
        Serialize constraint check results.
        
        Args:
            results: List of constraint check results
            
        Returns:
            Dictionary representation
        """
        return {
            "formal_constraints": [
                {
                    "id": r.constraint_id,
                    "name": r.constraint_name,
                    "result": r.result.value,
                    "value": r.value,
                    "threshold": r.threshold,
                    "margin": r.margin,
                    "evidence": r.evidence,
                    "confidence": r.confidence
                }
                for r in results
            ],
            "summary": {
                "proven_satisfied": len([r for r in results if r.result == CheckResult.PROVEN_SATISFIED]),
                "proven_violated": len([r for r in results if r.result == CheckResult.PROVEN_VIOLATED]),
                "unknown": len([r for r in results if r.result == CheckResult.UNKNOWN])
            }
        }
