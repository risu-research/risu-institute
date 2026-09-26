// Historical slice from PayloadGuard-PLG/payloadguard-evidence PR #41.
// B0: old Apixaban+Rifampicin executable semantics (unconditional Caution).
// S1: new literal ensures added by PR #41 for the orthopaedic indication.

datatype DOAC = Apixaban | OtherDOAC
datatype Agent = Rifampicin | OtherAgent
datatype TreatmentIndication = AFStrokePrevention | RecurrentVTEPrevention | OrthopaedicVTEProphylaxis
datatype Severity = Caution | NotCovered
datatype Risk = ThrombosisRisk | UnknownRisk
datatype Result = InteractionResult(severity: Severity, risk: Risk)

function CheckInteraction(doac: DOAC, agent: Agent, hasOtherBleedingRiskFactors: bool,
                          treatmentIndication: TreatmentIndication): Result
  ensures (doac == Apixaban && agent == Rifampicin &&
           (treatmentIndication == AFStrokePrevention || treatmentIndication == RecurrentVTEPrevention)) ==>
          CheckInteraction(doac, agent, hasOtherBleedingRiskFactors, treatmentIndication) ==
            InteractionResult(Caution, ThrombosisRisk)
  ensures (doac == Apixaban && agent == Rifampicin &&
           treatmentIndication == OrthopaedicVTEProphylaxis) ==>
          CheckInteraction(doac, agent, hasOtherBleedingRiskFactors, treatmentIndication) ==
            InteractionResult(NotCovered, UnknownRisk)
{
  if doac == Apixaban && agent == Rifampicin then
    // PR #41 B0 arm: case (Apixaban, Rifampicin) => InteractionResult(Caution, ThrombosisRisk)
    InteractionResult(Caution, ThrombosisRisk)
  else
    InteractionResult(NotCovered, UnknownRisk)
}
