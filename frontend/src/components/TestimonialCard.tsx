import { motion } from "framer-motion";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  index: number;
}

const TestimonialCard = ({ quote, name, role, index }: TestimonialCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20"
    >
      <p className="text-lg text-white">“{quote}”</p>
      <div className="mt-6 text-sm text-gray-400">
        <p className="font-semibold text-white">{name}</p>
        <p>{role}</p>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
