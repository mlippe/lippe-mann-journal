import { Editor } from '@tiptap/core';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatRelative } from 'date-fns';
import { de } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NODE_HANDLES_SELECTED_STYLE_CLASSNAME =
  'node-handles-selected-style';

export function isValidUrl(url: string) {
  return /^https?:\/\/\S+$/.test(url);
}

export const duplicateContent = (editor: Editor) => {
  const { view } = editor;
  const { state } = view;
  const { selection } = state;

  editor
    .chain()
    .insertContentAt(
      selection.to,
      selection.content().content.firstChild?.toJSON(),
      {
        updateSelection: true,
      },
    )
    .focus(selection.to)
    .run();
};

type RelativeToken =
  | 'lastWeek'
  | 'yesterday'
  | 'today'
  | 'tomorrow'
  | 'nextWeek'
  | 'other';

type CustomStrings = Partial<Record<RelativeToken, string>>;

export function formatRelativeCustom(
  date: Date,
  baseDate: Date = new Date(),
  customStrings: CustomStrings = {},
) {
  const defaultFormatMap: Record<RelativeToken, string> = {
    lastWeek: "eeee',' p",
    yesterday: "'Gestern,' p",
    today: "'Heute,' p",
    tomorrow: "'Morgen,' p",
    nextWeek: "eeee 'um' p",
    other: 'P',
  };

  const locale = {
    ...de,
    formatRelative: (token: RelativeToken) => {
      return customStrings[token] ?? defaultFormatMap[token];
    },
  };

  return formatRelative(date, baseDate, { locale });
}

export function createPreview(
  html: string | null | undefined,
  length: number = 400,
) {
  if (!html) return '';

  const text = html
    .replace(/<[^>]*>/g, ' ') // Replace all tags with a space
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/'/g, "'");

  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= length) return cleaned;

  // Try to find a space near the end to avoid cutting words
  const truncated = cleaned.substring(0, length);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > length * 0.8) {
    return truncated.substring(0, lastSpace).trim() + '...';
  }

  return truncated.trim() + '...';
}
