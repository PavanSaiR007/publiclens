// CivicLens AI Copilot & Voice Dictation Assistant

export const sampleVoiceTranscripts = [
  "Large asphalt pothole right outside 5th Avenue and Pine Street. Already saw two bicycles almost crash into oncoming traffic. Depth is at least 15 centimeters with exposed gravel base.",
  "Street luminaire flickering continuously and went pitch black near the pedestrian crossing. Very dark blind spot directly next to elementary school crosswalk.",
  "Three industrial trash dumpsters overflowing onto public sidewalk. High winds scattering plastics and boxes into the roadway, blocking stroller access.",
  "Wooden slat on park bench is snapped and jagged. Exposed nails pointing upward near Riverside walking promenade, dangerous for children and runners."
];

export function polishReportText(rawText, category, place) {
  if (!rawText || rawText.trim().length < 5) {
    return {
      title: `Critical ${category || 'Civic'} Defect near ${place || 'Municipal Sector'}`,
      description: `Field inspection request: An active ${category?.toLowerCase() || 'infrastructure'} hazard has been identified near ${place || 'the designated location'}. Requires prompt dispatch of certified municipal maintenance crews to assess structural compromise and secure the pedestrian right-of-way.`
    };
  }

  const clean = rawText.trim();

  // Generate polished executive write-up
  const title = clean.length > 50 
    ? `${category}: ${clean.slice(0, 45)}...`
    : `${category}: ${clean}`;

  const enhancedDescription = `${clean}\n\n[CIVICCOPILOT AI SYNTHESIS]: Identified acute ${category.toLowerCase()} hazard requiring municipal department intervention. Visual indicators suggest immediate priority due to public safety exposure and pedestrian traffic proximity. Recommended action: Deploy field inspection unit for remediation per municipal municipal code SLA standards.`;

  return {
    title,
    description: enhancedDescription
  };
}
