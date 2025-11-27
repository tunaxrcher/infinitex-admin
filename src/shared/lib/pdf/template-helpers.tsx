/**
 * PDF Template Helper Components
 * Helper components for creating table-like layouts in React PDF
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  cell: {
    fontSize: 13,
  },
  cellBold: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  underline: {
    borderBottomWidth: 0.5,
    borderBottomStyle: 'dotted',
    borderBottomColor: '#000',
  },
});

interface TableRowProps {
  children: React.ReactNode;
}

interface TableCellProps {
  width: number; // Use flex points instead of percentage
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  underline?: boolean;
  bold?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ children }) => (
  <View style={styles.row}>{children}</View>
);

export const TableCell: React.FC<TableCellProps> = ({
  width,
  children,
  align = 'left',
  underline = false,
  bold = false,
}) => (
  <View style={{ flex: width }}>
    <Text
      style={[
        bold ? styles.cellBold : styles.cell,
        underline && styles.underline,
        { textAlign: align },
      ]}
    >
      {children || ' '}
    </Text>
  </View>
);

export const SpacerRow: React.FC<{ size?: number }> = ({ size = 6 }) => (
  <View style={{ height: size }} />
);

