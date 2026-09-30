# Corrected 18-algorithm historical transport validation

Tuned frame: 171 task IDs = 71 CC18 + 100 outside.
All 18 final algorithm identities canonicalized; 153/153 pairs analyzable.
Sign reversals: 20/153 (13.1%).
Strong reversals (.005 rule): 5; .010 rule: 3.
Interaction CIs excluding zero: 48; BH q<.05: 24.
104-vs-171 interaction-shift Spearman: 0.840.
Metadata matched tasks: 0 (0 CC18 + 0 outside).
Metadata features |SMD|>=0.5: 0; BH-KS q<.05: 0.

## Strong reversal pairs

| algorithm_a   | algorithm_b   |   n_cc18_common |   n_outside_common |   delta_cc18 |   delta_outside |   interaction_shift |       ci_lo |       ci_hi |   bootstrap_q_bh |   bootstrap_reversal_probability |   min_abs_contrast |   loo_reversal_retention | strong_reversal_005   | strong_reversal_010   |
|:--------------|:--------------|----------------:|-------------------:|-------------:|----------------:|--------------------:|------------:|------------:|-----------------:|---------------------------------:|-------------------:|-------------------------:|:----------------------|:----------------------|
| DecisionTree  | TabNet        |              71 |                 95 |  -0.0363732  |       0.0211725 |           0.0575457 |  0.0294676  |  0.0863675  |       0.00305969 |                           0.9604 |         0.0211725  |                        1 | True                  | True                  |
| NODE          | RandomForest  |              58 |                 79 |   0.00543811 |      -0.0181772 |          -0.0236153 | -0.0405709  | -0.00695646 |       0.0458954  |                           0.8455 |         0.00543811 |                        1 | True                  | False                 |
| NODE          | SAINT         |              34 |                 58 |   0.0120922  |      -0.0195643 |          -0.0316566 | -0.0575714  | -0.00966205 |       0.0611939  |                           0.9493 |         0.0120922  |                        1 | True                  | True                  |
| SAINT         | SVM           |              38 |                 59 |  -0.00884995 |       0.0261206 |           0.0349706 |  0.0064239  |  0.0679112  |       0.105882   |                           0.8804 |         0.00884995 |                        1 | True                  | False                 |
| DecisionTree  | MLP-rtdl      |              71 |                100 |  -0.0163863  |       0.0239965 |           0.0403828 |  0.00257415 |  0.0767695  |       0.120149   |                           0.8586 |         0.0163863  |                        1 | True                  | True                  |

## Top interpretable selection-shift features

No matched features.