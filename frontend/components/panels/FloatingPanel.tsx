import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TouchableWithoutFeedback, Animated, Dimensions,
} from "react-native";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export function FloatingPanel({
  visible, title, subtitle, onClose, children,
  width = 640, height = 520,
}: Props) {
  const colors = useColors();
  const styles = createStyles(colors);
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 280, friction: 24, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const panelWidth = Math.min(width, screenWidth - 32);
  const panelHeight = Math.min(height, screenHeight - 80);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Centered panel — sits above backdrop */}
      <View style={styles.centerer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.panel,
            { width: panelWidth, maxHeight: panelHeight },
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Title bar */}
          <View style={styles.titleBar}>
            <View style={styles.titleLeft}>
              <View style={styles.dot} />
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  centerer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.9,
    shadowRadius: 32,
    elevation: 24,
  },
  titleBar: {
    height: 40,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  title: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: colors.blue,
    letterSpacing: 2.5,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
    letterSpacing: 1,
    marginLeft: 4,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: colors.textDim,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
});
