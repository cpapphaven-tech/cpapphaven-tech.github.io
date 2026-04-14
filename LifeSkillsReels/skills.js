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
    }
];
