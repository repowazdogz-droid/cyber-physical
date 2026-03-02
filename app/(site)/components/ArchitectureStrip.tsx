import { Container } from './Container';
import styles from './ArchitectureStrip.module.css';

const pipelineSteps = [
  { label: 'Spec', short: 'Spec' },
  { label: 'Kernel', short: 'Kernel' },
  { label: 'Policy Pack', short: 'Policy' },
  { label: 'Claims/Evidence', short: 'Claims' },
  { label: 'Artifact Vault', short: 'Vault' },
  { label: 'Explainable Surfaces', short: 'Surfaces' },
  { label: 'Golden Regression', short: 'Goldens' },
  { label: 'CI Drift Gate', short: 'CI Gate' },
];

export function ArchitectureStrip() {
  return (
    <Container>
      <div className={styles.strip}>
        {pipelineSteps.map((step, index) => (
          <div key={index} className={styles.step}>
            <div className={styles.stepLabel}>{step.label}</div>
            <div className={styles.stepShort}>{step.short}</div>
            {index < pipelineSteps.length - 1 && (
              <div className={styles.arrow}>→</div>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}







































