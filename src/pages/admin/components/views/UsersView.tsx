import React from 'react';
import { motion } from 'framer-motion';
import Users from '../../../../pages/dashboard/users/Users';

export const UsersView: React.FC = () => (
    <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
    >
        <Users />
    </motion.div>
);

