import { useEffect, useState } from "react";
import { formatNextDue } from "../services/scheduler";

interface RelativeTimeProps {
    timestampSeconds: number;
}

export default function RelativeTime({ timestampSeconds }: RelativeTimeProps) {
    const [, setTick] = useState(0);

    useEffect(() => {
        // Update the relative time every minute
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    return <>{formatNextDue(timestampSeconds)}</>;
}
