import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { TagIcon } from 'lucide-react-native';

type CategoryBadgeProps = {
  categoryId?: string | null;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
};

// Default category colors for common categories
const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  work: '#3B82F6',      // Blue
  personal: '#10B981',   // Green
  study: '#8B5CF6',      // Purple
  health: '#EF4444',     // Red
  finance: '#F59E0B',    // Amber
  shopping: '#EC4899',   // Pink
  travel: '#06B6D4',     // Cyan
  home: '#84CC16',       // Lime
  other: '#6B7280',      // Gray
};

export function CategoryBadge({
  categoryId,
  categoryName,
  categoryColor,
  categoryIcon,
  size = 'md',
  showIcon = true
}: CategoryBadgeProps) {
  // Don't render if no category
  if (!categoryName && !categoryId) return null;

  const displayName = categoryName || categoryId || 'Other';
  const color = categoryColor || DEFAULT_CATEGORY_COLORS[displayName.toLowerCase()] || DEFAULT_CATEGORY_COLORS.other;

  // Convert hex color to RGB for background opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 107, g: 114, b: 128 }; // Default gray
  };

  const rgb = hexToRgb(color);
  const backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-2 py-1',
    lg: 'px-3 py-1.5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  };

  const iconSizeClasses = {
    sm: 8,
    md: 10,
    lg: 12
  };

  return (
    <View
      className={`flex-row items-center gap-1 rounded-full border ${sizeClasses[size]}`}
      style={{
        backgroundColor,
        borderColor
      }}
    >
      {showIcon && (
        <TagIcon
          size={iconSizeClasses[size]}
          color={color}
        />
      )}
      <Text
        className={`font-medium capitalize ${textSizeClasses[size]}`}
        style={{ color }}
      >
        {displayName}
      </Text>
    </View>
  );
}