import Sidebar from "./Sidebar";
import { motion } from "framer-motion";

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>

        <motion.div
          className="page-shell page-enter"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}