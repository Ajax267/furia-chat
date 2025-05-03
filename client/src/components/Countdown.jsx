export function Countdown({ target }) {
    const [timeLeft, setTimeLeft] = useState(target - Date.now());
    useEffect(() => {
      const timer = setInterval(() => setTimeLeft(target - Date.now()), 1000);
      return () => clearInterval(timer);
    }, [target]);
  
    if (timeLeft <= 0) return <span>00:00:00</span>;
    const h = String(Math.floor(timeLeft/3600000)).padStart(2,'0');
    const m = String(Math.floor((timeLeft%3600000)/60000)).padStart(2,'0');
    const s = String(Math.floor((timeLeft%60000)/1000)).padStart(2,'0');
    return <span>{`${h}:${m}:${s}`}</span>;
  }