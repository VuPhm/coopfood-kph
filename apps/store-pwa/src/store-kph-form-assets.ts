export function choiceAsset(value: string) {
  if (value === "NEAR_EXPIRY") return "imgFeatherClock";
  if (value === "EXPIRED") return "imgFeatherCalendar";
  if (value === "TORN_PACKAGING") return "imgFeatherPackage";
  if (value === "VACUUM_LEAK") return "imgFeatherPackage";
  if (value === "BRUISED_WATERLOGGED") return "imgFeatherAlertTriangle";
  if (value === "ROTTEN_MOLDY") return "imgFeatherAlertTriangle1";
  if (value === "CANCEL") return "imgFeatherTrash2";
  if (value === "EXCHANGE") return "imgFeatherRepeat";
  if (value === "RETURN") return "imgFeatherCornerUpLeft";
  return "imgFeatherMoreHorizontal";
}
