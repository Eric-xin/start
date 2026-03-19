import React, { useMemo } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

interface Props {
  text: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
  italicStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

type Segment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

// Supports lightweight inline markdown used by seeded cards: **bold** and *italic*.
function parseInlineMarkdown(text: string): Segment[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return tokens.map((token) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return { text: token.slice(2, -2), bold: true };
    }

    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return { text: token.slice(1, -1), italic: true };
    }

    return { text: token };
  });
}

export function MarkdownText({ text, style, boldStyle, italicStyle, numberOfLines }: Props) {
  const segments = useMemo(() => parseInlineMarkdown(text), [text]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((segment, index) => (
        <Text
          key={`${segment.text}-${index}`}
          style={[
            segment.bold ? boldStyle : undefined,
            segment.italic ? italicStyle : undefined,
          ]}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}
