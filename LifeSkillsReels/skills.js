const BANK = [
    {
        id: "ls-1",
        topic: "Time Management",
        hook: "The Two-Minute Rule",
        caption: "If a task takes less than two minutes to complete, do it immediately. This simple habit prevents small tasks from piling up and reduces mental clutter."
    },
    {
        id: "ls-2",
        topic: "Productivity",
        hook: "Eat the Frog",
        caption: "Tackle your hardest, most important task first thing in the morning (the frog). Once it's out of the way, the rest of your day will feel much easier and more productive."
    },
    {
        id: "ls-3",
        topic: "Communication",
        hook: "The 'I' Message Pattern",
        caption: "Instead of saying 'You always do this', shift to 'I feel [emotion] when [behavior] happens because [reason].' It drastically reduces defensiveness in conflicts."
    },
    {
        id: "ls-4",
        topic: "Learning",
        hook: "Feynman Technique",
        caption: "To learn a complex topic fast, try to explain it in simple terms as if you're teaching a 5-year-old. Wherever you struggle is where you need to study more."
    },
    {
        id: "ls-5",
        topic: "Focus",
        hook: "Pomodoro Technique",
        caption: "Work in 25-minute focused bursts followed by a 5-minute break. After four cycles, take a longer 15-30 minute break. This maintains high cognitive function without burnout."
    },
    {
        id: "ls-6",
        topic: "Finance",
        hook: "The 50/30/20 Rule",
        caption: "A simple budgeting framework: allocate 50% of your income towards Needs, 30% towards Wants, and 20% towards Savings and Debt repayment."
    },
    {
        id: "ls-7",
        topic: "Confidence",
        hook: "Power Posing",
        caption: "Standing in a posture of confidence, even when you don't feel confident, can actually alter your brain chemistry to make you feel more powerful and reduce stress."
    },
    {
        id: "ls-8",
        topic: "Sleep",
        hook: "The 10-3-2-1-0 Rule",
        caption: "10 hours before bed: No more caffeine. 3 hours: No more food/alcohol. 2 hours: No more work. 1 hour: No more screens. 0: The number of times you hit snooze."
    },
    {
        id: "ls-9",
        topic: "Habits",
        hook: "Habit Stacking",
        caption: "Link a new habit you want to build with a habit you already do daily. For example: 'After I brush my teeth, I will meditate for two minutes.'"
    },
    {
        id: "ls-10",
        topic: "Networking",
        hook: "The FORD Technique",
        caption: "When making small talk, stick to the FORD topics: Family, Occupation, Recreation, and Dreams. People love talking about these subjects, making conversations flow easily."
    },
    {
        id: "ls-11",
        topic: "Mindset",
        hook: "Growth Mindset",
        caption: "View challenges as opportunities to grow rather than tests of your worth. Adding 'yet' to your vocabulary ('I can't do this... yet') drastically rewires how you face failure."
    },
    {
        id: "ls-12",
        topic: "Memory",
        hook: "Spaced Repetition",
        caption: "To commit things to long-term memory, review them at increasing intervals over time. Ebbinghaus's spacing effect proves this is way more effective than cramming."
    },
    {
        id: "ls-13",
        topic: "Mental Health",
        hook: "The 5-4-3-2-1 Grounding Trick",
        caption: "During an anxiety attack, name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste to bring your brain back to the present."
    },
    {
        id: "ls-14",
        topic: "Decision Making",
        hook: "10-10-10 Rule",
        caption: "Stuck on a decision? Ask how you will feel about it in 10 minutes, 10 months, and 10 years. It instantly puts the decision into a realistic perspective."
    },
    {
        id: "ls-15",
        topic: "Email",
        hook: "The 'Inbox Zero' Mindset",
        caption: "Don't treat your inbox as a to-do list. Archive or delete emails you've handled, and only leave emails that still require a specific action from you."
    },
    {
        id: "ls-16",
        topic: "Social Skills",
        hook: "Active Listening",
        caption: "Listen to understand, not just to reply. Nod, make eye contact, and briefly summarize what the other person said to show you were genuinely engaged."
    },
    {
        id: "ls-17",
        topic: "Career",
        hook: "Under-promise, Over-deliver",
        caption: "Always give yourself a buffer when estimating timelines. Delivering a project a day early looks impressive, whereas delivering it a day late looks unprofessional."
    },
    {
        id: "ls-18",
        topic: "Diet",
        hook: "Drink Water First",
        caption: "Whenever you feel a sudden craving for junk food or a snack, drink a large glass of water and wait 15 minutes. Dehydration often masks itself as hunger."
    },
    {
        id: "ls-19",
        topic: "Reading",
        hook: "The 50-Page Rule",
        caption: "If you're not enjoying a book after 50 pages, drop it and move on to another one. Your time is too valuable to spend on books that don't captivate you."
    },
    {
        id: "ls-20",
        topic: "Goal Setting",
        hook: "SMART Goals",
        caption: "Make sure your goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Vague goals like 'get better at coding' are rarely achieved without a concrete plan."
    },
    {
        id: "ls-21",
        topic: "Discipline",
        hook: "The 5-Second Rule",
        caption: "When you have an instinct to act on a goal, physically move within 5 seconds or your brain will kill it. Countdown 5-4-3-2-1 and just GO."
    },
    {
        id: "ls-22",
        topic: "Reading",
        hook: "Audiobook Speed Hack",
        caption: "Listen to audiobooks or podcasts at 1.25x or 1.5x speed. Your brain easily adjusts to the faster pace, and you can consume significantly more knowledge in the same timeframe."
    },
    {
        id: "ls-23",
        topic: "Posture",
        hook: "The Doorframe Stretch",
        caption: "Every time you walk through a specific doorway in your house, stretch your arms out against the frame and lean forward for 10 seconds to fix rounded shoulders from desk sitting."
    },
    {
        id: "ls-24",
        topic: "Relationships",
        hook: "The 2-2-2 Rule",
        caption: "To maintain a strong relationship over time: Have a date night every 2 weeks, a weekend away every 2 months, and a week-long vacation every 2 years."
    },
    {
        id: "ls-25",
        topic: "Interviewing",
        hook: "The STAR Method",
        caption: "Answer behavioral interview questions using STAR: Situation, Task, Action, Result. It provides a structured, compelling story that highlights your competencies."
    },
    {
        id: "ls-26",
        topic: "Cooking",
        hook: "Mise en Place",
        caption: "A French culinary phrase meaning 'putting in place.' Measure and prepare all ingredients before you start cooking. It makes cooking less stressful and way more enjoyable."
    },
    {
        id: "ls-27",
        topic: "Fitness",
        hook: "Consistency > Intensity",
        caption: "A 15-minute workout done every day yields far better long-term results than a grueling 2-hour workout done once every two weeks. Focus on building the habit first."
    },
    {
        id: "ls-28",
        topic: "Conflict",
        hook: "The 'Yes, and...' Approach",
        caption: "Borrowed from improv comedy, validate the other person's point by saying 'Yes, and...' instead of 'Yes, but...', which immediately puts people on the defensive."
    },
    {
        id: "ls-29",
        topic: "Finance",
        hook: "The 24-Hour Rule",
        caption: "Before making any non-essential purchase over a certain amount (e.g., $50), wait 24 hours. The emotional impulse often fades, preventing buyer's remorse."
    },
    {
        id: "ls-30",
        topic: "Learning",
        hook: "Interleaved Practice",
        caption: "Instead of practicing one single skill in a block (AAA, BBB, CCC), mix them up (ABC, BCA, CAB). It feels harder, but improves long-term retention and skill transfer."
    },
    {
        id: "ls-31",
        topic: "Anxiety",
        hook: "Write It Down",
        caption: "If a worry is keeping you awake, write it out on paper. Translating abstract thoughts into concrete words forces the brain to process them, reducing mental looping."
    },
    {
        id: "ls-32",
        topic: "Persuasion",
        hook: "The Door-in-the-Face",
        caption: "Ask for a huge favor first, which is likely to be rejected. Then calmly follow up with a much smaller request (your actual goal). People are more likely to accept the concession."
    },
    {
        id: "ls-33",
        topic: "Focus",
        hook: "Delete Notifications",
        caption: "Turn off every non-essential notification on your phone. If you need to check an app, do it on your own terms, not when an algorithm demands your attention."
    },
    {
        id: "ls-34",
        topic: "Resilience",
        hook: "Stoic Dichotomy of Control",
        caption: "Divide your problems into two buckets: ‘Things in my control’ and ‘Things outside my control’. Only spend emotional energy on the first bucket."
    },
    {
        id: "ls-35",
        topic: "Finance",
        hook: "Pay Yourself First",
        caption: "Automate your savings to transfer immediately on payday. If you wait until the end of the month to save what’s left, there will usually be nothing left."
    },
    {
        id: "ls-36",
        topic: "Communication",
        hook: "Mirroring",
        caption: "To build instant rapport, subtly mimic the body language, tone, and pacing of the person you are talking to. It signals empathy and connection unconsciously."
    },
    {
        id: "ls-37",
        topic: "Motivation",
        hook: "The Seinfeld Strategy",
        caption: "Get a large calendar. Every day you complete your desired habit, mark a big red X. Your only goal becomes 'Don’t break the chain.'"
    },
    {
        id: "ls-38",
        topic: "Cooking",
        hook: "Salt & Acid Balance",
        caption: "If a dish tastes 'flat' but has enough salt, it’s probably missing acid. Squeeze a lemon or add a splash of vinegar. The transformation is miraculous."
    },
    {
        id: "ls-39",
        topic: "Productivity",
        hook: "Batch Processing",
        caption: "Group similar tasks together (like replying to all emails) and do them at once. Context-switching between different types of tasks drains massive amounts of cognitive energy."
    },
    {
        id: "ls-40",
        topic: "Social",
        hook: "Pause Before Answering",
        caption: "When asked a tough question, pause for 3 seconds before speaking. It makes you appear thoughtful, confident, and gives you a moment to formulate a sharper answer."
    },
    {
        id: "ls-41",
        topic: "Learning",
        hook: "Teach to Learn",
        caption: "We remember 90% of what we teach to others. If you want to truly master a subject, create a blog post, video, or presentation explaining it to a beginner."
    },
    {
        id: "ls-42",
        topic: "Happiness",
        hook: "The Gratitude Journal",
        caption: "Write down 3 things you are grateful for every morning. This physically rewires your brain’s reticular activating system to spot positive events throughout the day."
    },
    {
        id: "ls-43",
        topic: "Fitness",
        hook: "Incidental Exercise",
        caption: "Take the stairs instead of the elevator. Park at the back of the parking lot. These micro-workouts burn thousands of extra calories over the span of a year."
    },
    {
        id: "ls-44",
        topic: "Finance",
        hook: "Cost Per Use",
        caption: "When buying something expensive, calculate the 'cost per use'. A $300 jacket worn 300 times ($1/use) is a better investment than a $30 shirt worn once."
    },
    {
        id: "ls-45",
        topic: "Mindset",
        hook: "Premeditatio Malorum",
        caption: "A Stoic exercise: visualize the worst possible outcome of what you're attempting. You'll realize exactly what you can do to prevent it, and that the outcome isn't totally catastrophic."
    },
    {
        id: "ls-46",
        topic: "Memory",
        hook: "Memory Palace",
        caption: "To memorize a list, visualize a house you know well. Place bizarre visual representations of each item in different rooms. To recall, mentally walk through the rooms."
    },
    {
        id: "ls-47",
        topic: "Career",
        hook: "The Brag Document",
        caption: "Keep a running word document throughout the year describing all your work wins and completed projects. When performance review time comes, you're perfectly prepared."
    },
    {
        id: "ls-48",
        topic: "Social",
        hook: "Use Their First Name",
        caption: "To a person, their own name is the sweetest sound in any language. Use it appropriately in conversation to make them feel valued and respected."
    },
    {
        id: "ls-49",
        topic: "Mental Health",
        hook: "Box Breathing",
        caption: "Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds. Repeat. Used by Navy SEALs, this instantly down-regulates a stressed nervous system."
    },
    {
        id: "ls-50",
        topic: "Relationships",
        hook: "Assume Positive Intent",
        caption: "When someone hurts or offends you, assume they meant well but communicated poorly. This framework prevents toxic resentment from building over harmless misunderstandings."
    },
    {
        id: "ls-51",
        topic: "Cleaning",
        hook: "The 1-Touch Rule",
        caption: "When you pick an item up, you are not allowed to put it down until it is in its final proper place. This stops 'shuffling' clutter around the house."
    },
    {
        id: "ls-52",
        topic: "Sleep",
        hook: "Cool Core Temperature",
        caption: "Your body needs to drop its core temperature by 2-3 degrees to initiate sleep. Keep your bedroom cold (around 65°F / 18°C) for dramatically deeper sleep cycles."
    },
    {
        id: "ls-53",
        topic: "Brain",
        hook: "The Tetris Effect",
        caption: "Playing Tetris shortly after a traumatic event has been shown to disrupt the consolidation of stressful memories, significantly reducing the likelihood of developing PTSD."
    },
    {
        id: "ls-54",
        topic: "Diet",
        hook: "Protein First",
        caption: "Always eat the protein portion of your meal first. It signals your brain earlier and much faster that you are full, naturally preventing overeating of carbs and desserts."
    },
    {
        id: "ls-55",
        topic: "Time",
        hook: "Parkinson's Law",
        caption: "Work naturally expands to fill the time allotted for its completion. If you give yourself a week to perform a 2-hour task, it will inexplicably take a week. Shorten your deadlines."
    },
    {
        id: "ls-56",
        topic: "Productivity",
        hook: "The 80/20 Rule",
        caption: "Also known as the Pareto Principle: 80% of your results will come from just 20% of your efforts. Identify the vital 20% and mercilessly cut the busywork."
    },
    {
        id: "ls-57",
        topic: "Social",
        hook: "Point Your Feet",
        caption: "Look at a person's feet: if they are pointed away from you, they subconsciously want to leave the conversation. If they point toward you, they are fully engaged."
    },
    {
        id: "ls-58",
        topic: "Focus",
        hook: "Binaural Beats",
        caption: "Listening to 40Hz binaural beats has been scientifically proven to increase gamma brainwaves, leading to enhanced focus, memory recall, and flow state."
    },
    {
        id: "ls-59",
        topic: "Networking",
        hook: "The Weak Tie Theory",
        caption: "Your closest friends have the exact same opportunities and network as you. Acquaintances ('weak ties') act as bridges to entirely new networks, jobs, and insights."
    },
    {
        id: "ls-60",
        topic: "Perspective",
        hook: "Memento Mori",
        caption: "Remember that you will end. Using death as a daily anchor puts minor annoyances into perspective and focuses you on living vividly in the present moment."
    }
];
