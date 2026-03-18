// src/server.ts
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway is running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});