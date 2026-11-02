export interface BoardTheme {
  id: 'classic_green' | 'matte_black' | 'student_grid' | 'lined_notebook' | 'modern_white';
  name: string;
  description: string;
  iconName: string;
  viewBackgroundColor: string;
  defaultStrokeColor: string;
  penPalette: string[];
  isDark: boolean;
  gridSize?: number;
  pattern: 'none' | 'student_grid' | 'lined_notebook' | 'chalkboard';
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'classic_green',
    name: 'Bảng xanh phấn trắng',
    description: 'Bảng chống lóa màu xanh thẫm kinh điển của lớp học Việt Nam, viết phấn trắng và phấn vàng siêu nét.',
    iconName: 'School',
    viewBackgroundColor: '#0b3b2c',
    defaultStrokeColor: '#ffffff',
    penPalette: ['#ffffff', '#fef08a', '#fed7aa', '#86efac', '#93c5fd', '#f472b6'],
    isDark: true,
    pattern: 'chalkboard',
  },
  {
    id: 'matte_black',
    name: 'Bảng đen truyền thống',
    description: 'Bảng đen mờ truyền thống độ tương phản cao, tối ưu cho phòng học có máy chiếu độ sáng yếu.',
    iconName: 'Square',
    viewBackgroundColor: '#12161f',
    defaultStrokeColor: '#ffffff',
    penPalette: ['#ffffff', '#fde047', '#fca5a5', '#6ee7b7', '#38bdf8', '#c084fc'],
    isDark: true,
    pattern: 'chalkboard',
  },
  {
    id: 'student_grid',
    name: 'Giấy kẻ ô ly học sinh',
    description: 'Nền giấy kẻ ca-rô 5x5mm chuẩn tập học sinh, hỗ trợ vẽ hình học, đồ thị và viết chữ ngay hàng thẳng lối.',
    iconName: 'Grid',
    viewBackgroundColor: '#f8fafc',
    defaultStrokeColor: '#1d4ed8',
    penPalette: ['#1d4ed8', '#dc2626', '#16a34a', '#7c3aed', '#0f172a'],
    gridSize: 20,
    isDark: false,
    pattern: 'student_grid',
  },
  {
    id: 'lined_notebook',
    name: 'Giấy kẻ ngang giáo án',
    description: 'Nền giấy kẻ dòng ngang cách đều 8mm trang nhã dành cho giáo viên ghi chép các bước bài giảng.',
    iconName: 'AlignJustify',
    viewBackgroundColor: '#fcfbfa',
    defaultStrokeColor: '#1e293b',
    penPalette: ['#1e293b', '#2563eb', '#b91c1c', '#047857', '#d97706'],
    gridSize: 32,
    isDark: false,
    pattern: 'lined_notebook',
  },
  {
    id: 'modern_white',
    name: 'Bảng trắng văn phòng',
    description: 'Bảng mica trắng trơn tiêu chuẩn cho lớp học hiện đại, viết bút dạ các màu.',
    iconName: 'Maximize',
    viewBackgroundColor: '#ffffff',
    defaultStrokeColor: '#0f172a',
    penPalette: ['#0f172a', '#2563eb', '#dc2626', '#16a34a', '#7c3aed'],
    isDark: false,
    pattern: 'none',
  },
];

export function getThemeById(themeId?: string): BoardTheme {
  const found = BOARD_THEMES.find((t) => t.id === themeId);
  return found || BOARD_THEMES[4]; // Default to modern_white
}
