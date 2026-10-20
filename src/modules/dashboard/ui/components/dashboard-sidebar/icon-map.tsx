import {
  IconLayoutDashboard,
  IconPhoto,
  IconFolder,
  IconNotebook,
  IconListCheck,
} from '@tabler/icons-react';

interface IconMapProps {
  icon: string;
}

const IconMap = ({ icon }: IconMapProps) => {
  switch (icon) {
    case 'dashboard':
      return <IconLayoutDashboard />;
    case 'photo':
      return <IconPhoto />;
    case 'folder':
      return <IconFolder />;
    case 'post':
      return <IconNotebook />;
    case 'checklist':
      return <IconListCheck />;
    default:
      return <IconLayoutDashboard />;
  }
};

export default IconMap;
