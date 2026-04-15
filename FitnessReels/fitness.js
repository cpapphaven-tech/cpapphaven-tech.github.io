const BANK = [
    {
        id: "ft-1",
        topic: "Fat Loss",
        hook: "The Protein Leverage",
        caption: "Prioritize protein at every meal. Your body spends more energy digesting protein (TEF) than fats or carbs, and it keeps you full much longer, naturally reducing your overall calorie intake."
    },
    {
        id: "ft-2",
        topic: "Gym Hack",
        hook: "Progressive Overload",
        caption: "To grow muscle, you must consistently challenge it. Try to add just 1.25kg to the bar or perform one extra rep every single week. This micro-progress leads to massive long-term gains."
    },
    {
        id: "ft-3",
        topic: "Discipline",
        hook: "Never Miss Twice",
        caption: "Life happens and you will miss a workout. That's okay. The rule is: Never miss twice. One missed day is a slip; two missed days is the start of a new, bad habit."
    },
    {
        id: "ft-4",
        topic: "Fat Loss",
        hook: "NEAT Power",
        caption: "Non-Exercise Activity Thermogenesis (NEAT) accounts for more fat loss than your gym session. Pace while on the phone, take the stairs, and stand more to burn an extra 300-500 calories daily."
    },
    {
        id: "ft-5",
        topic: "Gym Hack",
        hook: "Mind-Muscle Connection",
        caption: "Don't just move the weight from A to B. Visualize the target muscle contracting and stretching. Slower, controlled reps are often more effective for growth than heavy, ego-driven lifting."
    },
    {
        id: "ft-6",
        topic: "Discipline",
        hook: "The 10-Minute Rule",
        caption: "Don't feel like training? Tell yourself you'll just go to the gym for 10 minutes. Usually, once you start moving and the blood flows, you'll end up finishing the whole session."
    },
    {
        id: "ft-7",
        topic: "Fitness",
        hook: "Sleep for Growth",
        caption: "Muscle isn't built in the gym; it's built in your bed. Growth hormone peaks during deep sleep. If you're consistently sleeping under 7 hours, you're leaving 50% of your progress on the table."
    },
    {
        id: "ft-8",
        topic: "Nutrition",
        hook: "Drink Water Before Meals",
        caption: "Drink 500ml of water 30 minutes before every meal. It increases satiety signals to the brain, helping you eat significantly less without feeling restricted."
    },
    {
        id: "ft-9",
        topic: "Mindset",
        hook: "Process Over Outcome",
        caption: "Stop obsessing over the scale. Focus on the 'lead measures': Did you hit your protein? Did you hit your steps? Did you lift today? If the process is right, the outcome is inevitable."
    },
    {
        id: "ft-10",
        topic: "Gym Hack",
        hook: "The First Rep Hint",
        caption: "If the first rep of your heaviest set feels light, increase the weight immediately. Your CNS is primed. Take advantage of those 'high-power' days before fatigue sets in."
    },
    {
        id: "ft-11",
        topic: "Fat Loss",
        hook: "Eat Your Calories",
        caption: "Stop drinking liquid calories (sodas, fancy coffees, large juices). Liquid calories don't trigger the same fullness hormones as solid food, making it extremely easy to overeat."
    },
    {
        id: "ft-12",
        topic: "Discipline",
        hook: "Identity Shift",
        caption: "Don't say 'I'm trying to get fit.' Say 'I am an athlete.' Athletes don't skip workouts when they're tired; they follow the schedule. Act as the person you want to become."
    },
    {
        id: "ft-13",
        topic: "Gym Hack",
        hook: "Rest Between Sets",
        caption: "Don't rush your rest. For heavy compound movements, 2-3 minutes of rest allows your ATP stores to replenish, letting you move more weight in your next set for better growth."
    },
    {
        id: "ft-14",
        topic: "Nutrition",
        hook: "Fiber is Cheat Code",
        caption: "Aim for 30g+ of fiber daily. Fiber slows down digestion and stabilizes blood sugar, preventing the energy crashes that lead to sugar cravings and binge eating."
    },
    {
        id: "ft-15",
        topic: "Mindset",
        hook: "Comparison is Theft",
        caption: "The only person you should compare yourself to is the person you were yesterday. Everyone's genetics, history, and starting points are different. Run your own race."
    },
    {
        id: "ft-16",
        topic: "Fat Loss",
        hook: "The 80/20 Food Rule",
        caption: "Eat whole, unprocessed foods 80% of the time. Use the other 20% for the foods you love. This flexibility prevents the 'restriction-binge' cycle and makes fat loss sustainable."
    },
    {
        id: "ft-17",
        topic: "Gym Hack",
        hook: "Full Range of Motion",
        caption: "Half-reps give half-results. Train through the full range of motion to recruit more muscle fibers and improve joint health. Quality reps always beat high numbers."
    },
    {
        id: "ft-18",
        topic: "Discipline",
        hook: "Friction Reduction",
        caption: "Pack your gym bag and set out your clothes the night before. By removing the small obstacles to starting, you make it much harder for your 'lazy' brain to talk you out of it."
    },
    {
        id: "ft-19",
        topic: "Fat Loss",
        hook: "Walking vs Running",
        caption: "A 1-hour walk is often better for fat loss than a 20-minute run. It burns calories without spiking your hunger hormones or putting massive stress on your joints."
    },
    {
        id: "ft-20",
        topic: "Nutrition",
        hook: "The Salt Secret",
        caption: "If you feel weak during a workout, you might just be low on sodium. A pinch of sea salt in your pre-workout water can improve blood flow and muscle contraction."
    },
    {
        id: "ft-21",
        topic: "Gym Hack",
        hook: "Barbell Over Machines",
        caption: "Prioritize big compound lifts (Squat, Deadlift, Bench, Press). They recruit the most muscle, release the most growth hormones, and give you the best 'bang for your buck' in the gym."
    },
    {
        id: "ft-22",
        topic: "Discipline",
        hook: "Accountability Partner",
        caption: "You are 65% more likely to complete a goal if you commit to someone. Find a gym buddy or an online community. Having someone expect you there makes a huge difference."
    },
    {
        id: "ft-23",
        topic: "Fat Loss",
        hook: "Strength Train While Cutting",
        caption: "When eating in a calorie deficit, you must lift heavy to tell your body: 'Wait, I need this muscle! Burn the fat instead!' This ensures you look 'toned' rather than just 'skinny'."
    },
    {
        id: "ft-24",
        topic: "Nutrition",
        hook: "Caffeine Timing",
        caption: "Stop all caffeine at least 8-10 hours before bed. Even if you can 'fall asleep' with caffeine in your system, it drastically reduces the QUALITY of your deep recovery sleep."
    },
    {
        id: "ft-25",
        topic: "Mindset",
        hook: "Motivation is a Lie",
        caption: "Motivation is a feeling that comes and goes. Discipline is doing the work when you have zero motivation. Don't wait to 'feel like it'; just start the routine."
    },
    {
        id: "ft-26",
        topic: "Gym Hack",
        hook: "Grip Strength",
        caption: "Many people's back growth is limited by their grip. Use straps for your heaviest rowing and pulling sets so your back muscles fail before your hands do."
    },
    {
        id: "ft-27",
        topic: "Fat Loss",
        hook: "Volume Matters",
        caption: "Veggies like spinach, broccoli, and zucchini are 'high volume' foods. You can eat massive plates of them for under 100 calories, physically stretching your stomach to feel full."
    },
    {
        id: "ft-28",
        topic: "Discipline",
        hook: "The Mirror Test",
        caption: "Every morning, look in the mirror and ask: 'If I do exactly what I did yesterday for the next year, where will I be?' If you don't like the answer, change something today."
    },
    {
        id: "ft-29",
        topic: "Nutrition",
        hook: "Don't Fear Fats",
        caption: "Healthy fats (omega-3s, avocados, nuts) are essential for hormone production. Extremely low-fat diets can crash your testosterone and mood. Balance is key."
    },
    {
        id: "ft-30",
        topic: "Fitness",
        hook: "Active Recovery",
        caption: "On your rest days, don't just sit on the couch. A light walk or yoga session improves blood flow to sore muscles, helping them recover and grow much faster."
    },
    {
        id: "ft-31",
        topic: "Fat Loss",
        hook: "The Morning Walk",
        caption: "A 20-minute walk in morning sunlight sets your circadian rhythm, improving your sleep at night and providing a low-stress calorie burn to start your day."
    },
    {
        id: "ft-32",
        topic: "Gym Hack",
        hook: "Internal Cues",
        caption: "Instead of 'pull the weight up', think 'drive your elbows back'. This simple mental shift helps engage the lats much more effectively during back exercises."
    },
    {
        id: "ft-33",
        topic: "Discipline",
        hook: "Self-Compassion",
        caption: "Being an 'all or nothing' person usually leads to 'nothing'. If you eat one cookie, don't throw away the whole day. Just make the very next choice a healthy one."
    },
    {
        id: "ft-34",
        topic: "Nutrition",
        hook: "Seasonal Eating",
        caption: "Fruits and veggies in season are more nutrient-dense and cheaper. They also provide the specific nutrients your body needs for that time of year."
    },
    {
        id: "ft-35",
        topic: "Mental Growth",
        hook: "Cold Showers",
        caption: "Starting your day with 60 seconds of cold water builds 'voluntary hardship'. It strengthens your prefrontal cortex, making you more resilient to stress later in the day."
    },
    {
        id: "ft-36",
        topic: "Gym Hack",
        hook: "Thumb Position",
        caption: "Try a 'thumbless' (suicide) grip on pull-downs and rows. It often reduces bicep involvement, allowing you to feel the squeeze in your back much better."
    },
    {
        id: "ft-37",
        topic: "Fat Loss",
        hook: "Hidden Sauces",
        caption: "Mayo, ranch, and honey mustard can add 300+ calories to a healthy salad. Swap them for balsamic vinegar, lemon juice, or hot sauce for massive calorie savings."
    },
    {
        id: "ft-38",
        topic: "Discipline",
        hook: "Morning Momentum",
        caption: "Win the first hour, win the day. Avoid your phone early on. Exercise, read, or meditate. Setting an intentional tone prevents you from living the day in 'reactive mode'."
    },
    {
        id: "ft-39",
        topic: "Nutrition",
        hook: "Chew More",
        caption: "It takes 20 minutes for your brain to realize you're full. Chewing each bite 20 times helps you enjoy your food and prevents you from overeating before your brain can stop you."
    },
    {
        id: "ft-40",
        topic: "Fitness",
        hook: "Mobility is King",
        caption: "Being strong but stiff is a recipe for injury. Dedicate 10 minutes a day to hip and shoulder mobility. You'll lift better, feel younger, and move more fluidly."
    },
    {
        id: "ft-41",
        topic: "Fat Loss",
        hook: "Spices for Metabolism",
        caption: "Cayenne pepper and ginger have a slight thermogenic effect. They also add massive flavor without calories, making bland diet food much more enjoyable."
    },
    {
        id: "ft-42",
        topic: "Gym Hack",
        hook: "Eccentric Control",
        caption: "The 'lowering' part of the lift causes the most muscle damage (the good kind). Lower the weight for a slow 2-3 seconds to maximize growth stimulus."
    },
    {
        id: "ft-43",
        topic: "Discipline",
        hook: "Environment Design",
        caption: "If there is junk food in your pantry, you will eventually eat it. If the path to the gym is easy, you will eventually go. Design your space to make good habits inevitable."
    },
    {
        id: "ft-44",
        topic: "Nutrition",
        hook: "Electrolyte Balance",
        caption: "Water alone isn't enough. You need Sodium, Potassium, and Magnesium. If you feel 'brain fog' or get muscle cramps, your electrolytes are likely out of balance."
    },
    {
        id: "ft-45",
        topic: "Mindset",
        hook: "The 40% Rule",
        caption: "When your mind tells you that you are finished and exhausted, you're actually only 40% done. Your body has much deeper reserves than your comfort-seeking brain wants to admit."
    },
    {
        id: "ft-46",
        topic: "Gym Hack",
        hook: "Deadlift Footwear",
        caption: "Stop deadlifting in squishy running shoes. The unstable base robs you of power. Go barefoot or use flat shoes (like Converse) to drive more force from the floor."
    },
    {
        id: "ft-47",
        topic: "Fat Loss",
        hook: "Alcohol is a Pause",
        caption: "When you drink alcohol, your body stops burning fat to prioritize burning the toxins. It doesn't just add calories; it pauses your fat-burning engine for hours."
    },
    {
        id: "ft-48",
        topic: "Discipline",
        hook: "Visual Cues",
        caption: "Put a 'Habit Tracker' on your wall where you see it every time you enter the room. The psychological need to 'not break the chain' of X's is a powerful tool."
    },
    {
        id: "ft-49",
        topic: "Nutrition",
        hook: "The 30g Protein Goal",
        caption: "Try to get 30g of protein in your breakfast. It switches your body out of a fasted catabolic state and sets your blood sugar on a stable path for the day."
    },
    {
        id: "ft-50",
        topic: "Fitness",
        hook: "Consistency is Magic",
        caption: "An average plan followed perfectly for a year will beat a 'perfect' plan followed for three weeks every time. Don't look for secrets; look for consistency."
    },
    {
        id: "ft-51",
        topic: "Gym Hack",
        hook: "Unilateral Training",
        caption: "Don't just use barbells. Use dumbbells to train one side at a time. This identifies and fixes strength imbalances and builds a much more stable core."
    },
    {
        id: "ft-52",
        topic: "Fat Loss",
        hook: "Stress Management",
        caption: "High cortisol (stress hormone) tells your body to store fat, especially around the midsection. Meditation and fun aren't 'optional'; they're essential for fat loss."
    },
    {
        id: "ft-53",
        topic: "Discipline",
        hook: "Delayed Gratification",
        caption: "The ability to choose what you want MOST over what you want NOW is the ultimate predictor of success in fitness and life. Practice it daily."
    },
    {
        id: "ft-54",
        topic: "Nutrition",
        hook: "Creatine Monohydrate",
        caption: "The most researched supplement in history. 5g a day improves strength, muscle volume, and even brain function. It’s cheap, safe, and highly effective."
    },
    {
        id: "ft-55",
        topic: "Mindset",
        hook: "The Gain vs The Gap",
        caption: "Instead of looking at how far you have to go (The Gap), look at how far you have already come (The Gain). Gratitude for progress fuels the drive to continue."
    },
    {
        id: "ft-56",
        topic: "Gym Hack",
        hook: "Lifting Straps vs Chalk",
        caption: "Chalk improves grip while maintaining hand-strength building. Straps bypass grip entirely. Use chalk for warmups and straps for your heaviest 'top sets'."
    },
    {
        id: "ft-57",
        topic: "Fat Loss",
        hook: "Nighttime Hunger",
        caption: "If you're hungry at night, you're usually just bored or dehydrated. Drink herbal tea. The warm liquid and the ritual often kill the psychological craving."
    },
    {
        id: "ft-58",
        topic: "Discipline",
        hook: "The Power of Routine",
        caption: "Decision fatigue is real. The more decisions you automate (training at the same time, eating the same lunch), the more mental energy you have for the actual work."
    },
    {
        id: "ft-59",
        topic: "Nutrition",
        hook: "Post-Workout Window",
        caption: "The '30-minute anabolic window' is mostly a myth. Just ensure you get a balanced, protein-rich meal within 2-3 hours of training for optimal recovery."
    },
    {
        id: "ft-60",
        topic: "Fitness",
        hook: "The 3 Pillars",
        caption: "Progress = (Training + Nutrition) x Consistency. If any of these is zero, your total progress will be zero. Master the fundamentals before chasing minor details."
    },
    {
        id: "ft-61",
        topic: "Fat Loss",
        hook: "Fiber First",
        caption: "Eat your veggies before your main meal. The fiber creates a physical mesh in your stomach that slows down the absorption of sugars and fats from the rest of the meal."
    },
    {
        id: "ft-62",
        topic: "Gym Hack",
        hook: "Warm-up Sets",
        caption: "Don't just jump into your heavy weight. Perform 2-3 'feeler' sets with lighter weights to lubricate your joints and prep your nervous system for the heavy load."
    },
    {
        id: "ft-63",
        topic: "Discipline",
        hook: "Negative Visualization",
        caption: "Visualize exactly how you'll feel tonight if you skip your workout and eat junk. That feeling of regret is often a stronger motivator than the promise of future health."
    },
    {
        id: "ft-64",
        topic: "Nutrition",
        hook: "Casein Before Bed",
        caption: "A slow-digesting protein like Casein (found in cottage cheese or Greek yogurt) before bed provides a steady stream of amino acids to repair muscle while you sleep."
    },
    {
        id: "ft-65",
        topic: "Mindset",
        hook: "The 2-Minute Rule (Fitness)",
        caption: "If a workout feels too daunting, commit to just putting on your gym shoes. Once the shoes are on, the 2rd step (getting in the car) feels much easier."
    },
    {
        id: "ft-66",
        topic: "Gym Hack",
        hook: "Hook Grip",
        caption: "For heavy deadlifts or cleans, wrap your fingers over your thumb. It's painful at first, but it creates a literal lock that prevents the bar from rolling out of your hands."
    },
    {
        id: "ft-67",
        topic: "Fat Loss",
        hook: "Spice up Your Metabolism",
        caption: "Capsaicin in spicy peppers can slightly boost your metabolic rate and reduce appetite. Add some chili flakes to your chicken for an extra calorie-burning edge."
    },
    {
        id: "ft-68",
        topic: "Discipline",
        hook: "Pre-Commitment",
        caption: "Pay for your gym membership or a trainer in advance. When you've already 'spent' the money, the psychological pain of wasting it drives you to show up."
    },
    {
        id: "ft-69",
        topic: "Nutrition",
        hook: "Avoid 'Low Fat' Labels",
        caption: "Often, companies replace fat with sugar to keep the taste. 'Low Fat' usually means 'High Sugar'. Read the ingredient list, not the marketing on the front."
    },
    {
        id: "ft-70",
        topic: "Fitness",
        hook: "Sunlight & Vitamin D",
        caption: "Vitamin D is technically a hormone essential for testosterone and immunity. Get 15 mins of direct sun daily. If you live in a dark climate, supplement with D3."
    },
    {
        id: "ft-71",
        topic: "Gym Hack",
        hook: "Pause Reps",
        caption: "At the bottom of a bench press or squat, pause for 1 second. This removes the 'bounce' momentum and forces the muscle to work much harder to move the weight."
    },
    {
        id: "ft-72",
        topic: "Fat Loss",
        hook: "The 'Only' Rule",
        caption: "When out with friends, pick ONE: Either the drink, the appetizer, or the dessert. Trying to have all three is where most people crash their weekly progress."
    },
    {
        id: "ft-73",
        topic: "Discipline",
        hook: "Identity Habits",
        caption: "Every time you choose the salad over the fries, you are casting a 'vote' for the person you want to become. You don't need to be perfect; you just need a majority of votes."
    },
    {
        id: "ft-74",
        topic: "Nutrition",
        hook: "Potassium for Pump",
        caption: "Most people focus only on salt. Potassium (from bananas or potatoes) is what actually pulls water INTO the muscle cells, giving you a harder, fuller look."
    },
    {
        id: "ft-75",
        topic: "Mindset",
        hook: "Stress-Testing Your Goals",
        caption: "Don't plan for your best days; plan for your worst. What's the minimum workout you'll do when you're busy, tired, and stressed? That's your true baseline."
    },
    {
        id: "ft-76",
        topic: "Gym Hack",
        hook: "Video Your Form",
        caption: "What you 'feel' you are doing is often different from what you are 'actually' doing. Record your sets to spot rounding backs or shallow depths before they cause injury."
    },
    {
        id: "ft-77",
        topic: "Fat Loss",
        hook: "The Cold Water Trick",
        caption: "Drinking ice-cold water forces your body to expend energy to warm it up to body temperature. It's a tiny boost, but it adds up over thousands of glasses."
    },
    {
        id: "ft-78",
        topic: "Discipline",
        hook: "Win Your Evenings",
        caption: "Your morning routine actually starts the night before. Set your alarm, prep your meals, and put your phone in another room. A good tomorrow is built tonight."
    },
    {
        id: "ft-79",
        topic: "Nutrition",
        hook: "Magnesium for Recovery",
        caption: "Magnesium relaxes the nervous system and prevents muscle cramps. Take it before bed to help your body shift into 'rest and digest' mode for deeper recovery."
    },
    {
        id: "ft-80",
        topic: "Fitness",
        hook: "Grip It Hard",
        caption: "Squeezing the bar as hard as you can during any lift sends a signal to your nervous system to recruit more surrounding muscles (the 'Irradiation' principle)."
    },
    {
        id: "ft-81",
        topic: "Fat Loss",
        hook: "Walk Post-Meal",
        caption: "A 10-minute walk immediately after eating significantly blunts the blood sugar spike of that meal, helping prevent fat storage and afternoon energy crashes."
    },
    {
        id: "ft-82",
        topic: "Gym Hack",
        hook: "The 'Top Set' Method",
        caption: "Focus 100% of your energy on one heavy 'top set' where you push to near failure. Use your remaining sets as back-off sets for extra volume and blood flow."
    },
    {
        id: "ft-83",
        topic: "Discipline",
        hook: "Delay, Don't Deny",
        caption: "If you're craving junk, tell yourself: 'I can have it, but I have to wait 20 minutes and drink a glass of water first.' Often, the craving will vanish during the wait."
    },
    {
        id: "ft-84",
        topic: "Nutrition",
        hook: "Eggs are Superfood",
        caption: "Eggs have the highest 'Bioavailability' of any protein source, meaning your body can actually use almost 100% of the protein they contain. Don't skip the yolks!"
    },
    {
        id: "ft-85",
        topic: "Mindset",
        hook: "The Power of 'Yet'",
        caption: "Instead of 'I'm not strong', say 'I'm not strong YET'. This tiny word shifts your brain from a fixed mindset to a growth mindset, opening the door for progress."
    },
    {
        id: "ft-86",
        topic: "Gym Hack",
        hook: "Neutral Spine",
        caption: "Protect your neck! Stop looking in the side-mirror during squats or deadlifts. Keep your neck in line with your spine to prevent unnecessary strain and disc issues."
    },
    {
        id: "ft-87",
        topic: "Fat Loss",
        hook: "Black Coffee Power",
        caption: "Black coffee is a natural thermogenic and appetite suppressant with zero calories. Use it strategically in the morning to extend your fat-burning window."
    },
    {
        id: "ft-88",
        topic: "Discipline",
        hook: "The Social Shield",
        caption: "When people pressure you to drink or eat junk, don't say 'I can't'. Say 'I don't'. 'I can't' sounds like a struggle; 'I don't' sounds like a core identity."
    },
    {
        id: "ft-89",
        topic: "Nutrition",
        hook: "Omega-3 for Joints",
        caption: "Heavy lifting is hard on joints. High-quality fish oil reduces systemic inflammation, keeping your knees and elbows healthy as you get stronger."
    },
    {
        id: "ft-90",
        topic: "Fitness",
        hook: "The Compound Effect",
        caption: "Small changes do not result in small outcomes. They result in massive outcomes over time. 1% better every day results in being 37 times better over a single year."
    }
];
