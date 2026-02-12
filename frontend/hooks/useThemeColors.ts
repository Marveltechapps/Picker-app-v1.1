import { useMemo } from "react";
import { getThemeColors } from "@/config/theme";

/** Returns light theme colors only. */
export const useThemeColors = () => useMemo(() => getThemeColors("light"), []);
