import {
  IconLayoutDashboard,
  IconPhoto,
  IconUser,
  IconNotebook,
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
    case 'user':
      return <IconUser />;
    case 'post':
      return <IconNotebook />;
    default:
      return <IconLayoutDashboard />;
  }
};

export default IconMap;
