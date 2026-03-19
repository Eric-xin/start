import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TouchableWithoutFeedback, Animated,
} from "react-native";
import { Colors } from "../../constants/colors";
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
            { width, maxHeight: height },
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderRadius: 2,
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.9)",
  },
  titleBar: {
    height: 40,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
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
    backgroundColor: Colors.blue,
  },
  title: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    letterSpacing: 2.5,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 1,
    marginLeft: 4,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.textDim,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
});
