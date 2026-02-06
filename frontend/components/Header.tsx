import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, StatusBar, Platform } from "react-native";
import { ChevronLeft, LucideIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Typography, Spacing, IconSizes } from "@/constants/theme";
import { useColors } from "@/contexts/ColorsContext";
import { useTheme } from "@/state/themeContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: LucideIcon;
  onRightPress?: () => void;
  rightIconColor?: string;
}

export default function Header({
  title,
  subtitle,
  showBack = true,
  onBackPress,
  rightIcon: RightIcon,
  onRightPress,
  rightIconColor,
}: HeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const { effectiveTheme } = useTheme();
  
  const defaultRightIconColor = rightIconColor || colors.text.primary;
  const statusBarStyle = effectiveTheme === 'dark' ? 'light-content' : 'dark-content';
  
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.headerTop,
      paddingBottom: Spacing.xl,
      backgroundColor: colors.card,
    },
    backButton: {
      width: Spacing.iconButton,
      height: Spacing.iconButton,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -Spacing.md,
    },
    titleContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.sm,
      height: 48,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text.primary,
      letterSpacing: Typography.letterSpacing.normal,
    },
    subtitle: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.regular,
      color: colors.text.secondary,
      marginTop: Spacing.xs,
    },
    rightButton: {
      width: Spacing.iconButton,
      height: Spacing.iconButton,
      alignItems: "center",
      justifyContent: "center",
    },
  }), [colors]);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          // If no back history, navigate to home
          router.push("/(tabs)");
        }
      } catch (error) {
        // Silently handle navigation error
        try {
          router.push("/(tabs)");
        } catch {
          // Fallback failed
        }
      }
    }
  };

  return (
    <>
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={colors.card}
      />
      <View style={styles.container}>
        {showBack ? (
          <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} onPress={handleBackPress}>
            <ChevronLeft color={colors.text.primary} size={IconSizes.xl} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {RightIcon ? (
          <Pressable style={({ pressed }) => [styles.rightButton, pressed && { opacity: 0.7 }]} onPress={onRightPress}>
            <RightIcon color={defaultRightIconColor} size={24} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.rightButton} />
        )}
      </View>
    </>
  );
}
