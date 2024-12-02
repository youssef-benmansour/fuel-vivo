import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // This is a blue color, you can change it to your preferred color
    },
    secondary: {
      main: '#dc004e', // This is a pink color, you can change it to your preferred color
    },
    // You can add more color definitions here
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    // You can customize typography settings here
  },
  // You can add more theme customizations here
});

export default theme;