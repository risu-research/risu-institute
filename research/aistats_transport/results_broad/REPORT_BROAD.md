# Broad historical validation

Broad tasks: 171; algorithms: 22; selected18 present: 15
Manifest177 overlap: 171/177; missing: 6; extras: 0
CC18 overlap: 71 / 72
Eligible selected18 pairs: 105; reversals: 12; strong(.005): 4; BH q<.05 interactions: 21
104-vs-broad reversal-flag agreement: 0.857; interaction-shift Spearman: 0.884
Median leave-one-task-out reversal retention: 1.0

## Threshold sensitivity

|   min_common |   eligible_pairs |   sign_reversals |   strong_rev_005 |   q_lt_005 |
|-------------:|-----------------:|-----------------:|-----------------:|-----------:|
|           10 |              105 |               12 |                4 |         21 |
|           15 |              105 |               12 |                4 |         21 |
|           20 |              105 |               12 |                4 |         21 |
|           25 |              105 |               12 |                4 |         21 |
|           30 |              105 |               12 |                4 |         21 |

## Broad reversal pairs

| algorithm_a   | algorithm_b   |   n_cc18_common |   n_outside_common |   delta_cc18 |   delta_outside |   interaction_shift |       ci_lo |       ci_hi |   bootstrap_q_bh |   bootstrap_reversal_probability |   min_abs_contrast |   loo_reversal_retention | strong_reversal_005   | strong_reversal_010   |
|:--------------|:--------------|----------------:|-------------------:|-------------:|----------------:|--------------------:|------------:|------------:|-----------------:|---------------------------------:|-------------------:|-------------------------:|:----------------------|:----------------------|
| CatBoost      | LightGBM      |              67 |                 92 | -0.00188862  |      0.00614383 |          0.00803245 | -0.00449529 |  0.019977   |       0.32987    |                           0.6844 |        0.00188862  |                 1        | False                 | False                 |
| DANet         | RandomForest  |              62 |                 84 |  0.00263767  |     -0.0105839  |         -0.0132216  | -0.0298006  |  0.00383079 |       0.250158   |                           0.7045 |        0.00263767  |                 1        | False                 | False                 |
| DANet         | SAINT         |              36 |                 63 |  0.00548161  |     -0.0131859  |         -0.0186675  | -0.0428604  |  0.00469565 |       0.250158   |                           0.6993 |        0.00548161  |                 0.989899 | False                 | False                 |
| DecisionTree  | KNN           |              68 |                 96 | -0.000959123 |      0.0343573  |          0.0353164  |  0.00317949 |  0.0676481  |       0.103399   |                           0.5425 |        0.000959123 |                 0.908537 | False                 | False                 |
| DecisionTree  | MLP           |              71 |                 99 | -0.00387357  |      0.0292751  |          0.0331486  |  0.00132713 |  0.0646539  |       0.11928    |                           0.638  |        0.00387357  |                 1        | False                 | False                 |
| DecisionTree  | NODE          |              58 |                 80 | -0.0355145   |      0.00539655 |          0.040911   |  0.019733   |  0.0639638  |       0.00419958 |                           0.7691 |        0.00539655  |                 1        | False                 | False                 |
| DecisionTree  | STG           |              70 |                 93 | -0.00559607  |      0.0238094  |          0.0294055  | -0.00378205 |  0.0613935  |       0.19823    |                           0.6675 |        0.00559607  |                 1        | False                 | False                 |
| DecisionTree  | TabNet        |              71 |                 95 | -0.0363732   |      0.0211725  |          0.0575457  |  0.0292665  |  0.0863154  |       0.00262474 |                           0.9618 |        0.0211725   |                 1        | True                  | True                  |
| KNN           | MLP           |              68 |                 95 |  0.0013781   |     -0.0032958  |         -0.00467391 | -0.0313164  |  0.0226467  |       0.833639   |                           0.521  |        0.0013781   |                 0.957055 | False                 | False                 |
| NODE          | RandomForest  |              58 |                 79 |  0.00543811  |     -0.0181772  |         -0.0236153  | -0.0404099  | -0.00700533 |       0.0320494  |                           0.8483 |        0.00543811  |                 1        | True                  | False                 |
| NODE          | SAINT         |              34 |                 58 |  0.0120922   |     -0.0195643  |         -0.0316566  | -0.0578385  | -0.00981228 |       0.0542446  |                           0.9491 |        0.0120922   |                 1        | True                  | True                  |
| SAINT         | SVM           |              38 |                 59 | -0.00884995  |      0.0261206  |          0.0349706  |  0.00533524 |  0.0668462  |       0.0907651  |                           0.8742 |        0.00884995  |                 1        | True                  | False                 |