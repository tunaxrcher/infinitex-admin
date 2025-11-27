/**
 * PDF Table Helper Components
 * Makes PDF layout code more readable and maintainable
 */

import React from 'react';
import { StyleSheet, Text, View } from '@react-pdf/renderer';

// A4 width calculation
const PAGE_WIDTH = 515; // 595 - (40 padding * 2)
export const w = (percent: number) => (PAGE_WIDTH * percent) / 100;

// Base styles
const cellStyles = StyleSheet.create({
  base: {
    fontSize: 12,
    overflow: 'hidden',
  },
  bold: {
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  underline: {
    borderBottomWidth: 0.5,
    borderBottomStyle: 'dotted',
    borderBottomColor: '#000',
  },
});

// ============================================
// TABLE COMPONENTS
// ============================================

interface TRProps {
  children: React.ReactNode;
}

interface THProps {
  width: number; // percentage (0-100)
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  underline?: boolean;
  bold?: boolean;
}

/**
 * Table Row (like <tr>)
 */
export const TR: React.FC<TRProps> = ({ children }) => (
  <View style={{ flexDirection: 'row', width: PAGE_WIDTH }}>{children}</View>
);

/**
 * Table Cell (like <th>)
 */
export const TH: React.FC<THProps> = ({
  width,
  children,
  align = 'left',
  underline = false,
  bold = false,
}) => (
  <View style={{ width: w(width) }}>
    <Text
      style={[
        bold ? cellStyles.bold : cellStyles.base,
        underline && cellStyles.underline,
        { textAlign: align },
      ]}
    >
      {children || ' '}
    </Text>
  </View>
);

/**
 * Spacer (vertical space between rows)
 */
export const Spacer: React.FC<{ size?: number }> = ({ size = 6 }) => (
  <View style={{ height: size }} />
);

/**
 * Empty cell (for spacing)
 */
export const EmptyTH: React.FC<{ width: number }> = ({ width }) => (
  <TH width={width}> </TH>
);
