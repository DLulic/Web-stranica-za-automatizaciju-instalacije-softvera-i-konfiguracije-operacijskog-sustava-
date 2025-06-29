import { jwtDecode } from 'jwt-decode';

export function checkAdmin() {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }
  const decodedToken = jwtDecode(token);
  return (decodedToken.role === "Admin");
}

export function checkLoggedIn() {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }
  const decodedToken = jwtDecode(token);
  return (decodedToken.role === "Admin");
}