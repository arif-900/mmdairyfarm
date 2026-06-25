export const getDashboardByRole = (role: string | null): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'staff':
      return '/staff/dashboard';
    case 'delivery_boy':
      return '/delivery/dashboard';
    case 'customer':
    default:
      return '/';
  }
};
