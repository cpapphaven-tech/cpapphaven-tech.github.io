const BANK = [
    {
        id: "fb-1",
        topic: "World Cup History",
        hook: "Most World Cup Wins",
        caption: "Brazil has won the FIFA World Cup a record five times (1958, 1962, 1970, 1994, and 2002). They are the only team to have played in every single World Cup tournament."
    },
    {
        id: "fb-2",
        topic: "Legendary Players",
        hook: "Pele's Goal Record",
        caption: "Pele is the only player to win three FIFA World Cups (1958, 1962, 1970). He scored 1,281 goals in 1,363 games during his professional career according to Guinness World Records."
    },
    {
        id: "fb-3",
        topic: "Speed Records",
        hook: "Fastest Goal Ever",
        caption: "The fastest goal in international football history was scored by Lukas Podolski for Germany against Ecuador in 2013, hitting the net just 6 seconds after kickoff."
    },
    {
        id: "fb-4",
        topic: "Clubs",
        hook: "Real Madrid's Dominance",
        caption: "Real Madrid holds the record for the most UEFA Champions League titles, winning it 15 times. They also won the first five editions of the tournament from 1956 to 1960."
    },
    {
        id: "fb-5",
        topic: "World Cup Trivia",
        hook: "First World Cup",
        caption: "The first ever FIFA World Cup was held in 1930 in Uruguay. The host nation Uruguay won the tournament, defeating Argentina 4-2 in the final."
    },
    {
        id: "fb-6",
        topic: "Player Achievements",
        hook: "Messi's Ballon d'Ors",
        caption: "Lionel Messi has won a record 8 Ballon d'Or awards, the most by any player in history. He is widely considered one of the greatest players to ever grace the pitch."
    },
    {
        id: "fb-7",
        topic: "League Facts",
        hook: "Premier League Foundation",
        caption: "The English Premier League was founded on February 20, 1992, after clubs in the First Division decided to break away from the Football League to take advantage of a lucrative television rights deal."
    },
    {
        id: "fb-8",
        topic: "Stadiums",
        hook: "Largest Stadium",
        caption: "The Rungrado 1st of May Stadium in Pyongyang, North Korea, is the largest football stadium in the world by capacity, officially holding 114,000 spectators."
    },
    {
        id: "fb-9",
        topic: "Transfers",
        hook: "Neymar's Transfer Fee",
        caption: "Neymar Jr. holds the record for the most expensive transfer in football history. Paris Saint-Germain paid Barcelona €222 million to sign him in 2017."
    },
    {
        id: "fb-10",
        topic: "International",
        hook: "Most International Goals",
        caption: "Cristiano Ronaldo holds the record for the most goals scored in international football by a male player, surpassing Iran's Ali Daei in 2021."
    },
    {
        id: "fb-11",
        topic: "Champions League",
        hook: "The 'Invincibles'",
        caption: "Arsenal FC is the only team in the Premier League era to go an entire 38-game season unbeaten (2003-2004), a feat that earned them the nickname 'The Invincibles'."
    },
    {
        id: "fb-12",
        topic: "Goalkeepers",
        hook: "The Black Spider",
        caption: "Lev Yashin is the only goalkeeper to ever win the Ballon d'Or (1963). Known as the 'Black Spider', he is famous for saving over 150 penalty kicks."
    },
    {
        id: "fb-13",
        topic: "Matches",
        hook: "Highest Scoring Game",
        caption: "The highest score ever recorded in a football match was 149-0. AS Adema won against SO l'Emyrne in Madagascar in 2002 after the losing team scored intentional own goals."
    },
    {
        id: "fb-14",
        topic: "World Cup History",
        hook: "The Stolen Trophy",
        caption: "The original World Cup trophy, the Jules Rimet Trophy, was stolen in 1966 in London and found by a dog named Pickles hidden in a garden hedge."
    },
    {
        id: "fb-15",
        topic: "National Teams",
        hook: "Iceland's Population",
        caption: "In 2018, Iceland became the smallest nation by population (approx. 330,000) to ever qualify for a FIFA World Cup."
    },
    {
        id: "fb-16",
        topic: "Awards",
        hook: "Puskas Award",
        caption: "The FIFA Puskas Award was created in 2009 to honor the player who scored the most aesthetically significant or 'most beautiful' goal of the year."
    },
    {
        id: "fb-17",
        topic: "Origins",
        hook: "Oldest Club",
        caption: "Sheffield FC, founded in 1857 in England, is officially recognized by FIFA and the FA as the world's oldest independent football club."
    },
    {
        id: "fb-18",
        topic: "Modern Tech",
        hook: "VAR Introduction",
        caption: "Video Assistant Referee (VAR) was first written into the Laws of the Game in 2018. It was used in a World Cup for the first time during the 2018 tournament in Russia."
    },
    {
        id: "fb-19",
        topic: "Rules",
        hook: "Red and Yellow Cards",
        caption: "Red and yellow cards were first introduced at the 1970 World Cup in Mexico. They were inspired by traffic lights to help overcome language barriers between refs and players."
    },
    {
        id: "fb-20",
        topic: "Fan Culture",
        hook: "The Mexican Wave",
        caption: "The 'Mexican Wave' (La Ola) became globally famous during the 1986 World Cup in Mexico, although its origins are often debated among North American sports fans."
    },
    {
        id: "fb-21",
        topic: "International",
        hook: "Women's World Cup",
        caption: "The first FIFA Women's World Cup was held in 1991 in China. The United States won the tournament, and they remain the most successful team in women's football."
    },
    {
        id: "fb-22",
        topic: "Legendary Moments",
        hook: "Hand of God",
        caption: "Diego Maradona scored his famous 'Hand of God' goal against England in the 1986 World Cup quarterfinals, followed just minutes later by the 'Goal of the Century'."
    },
    {
        id: "fb-23",
        topic: "Ball Facts",
        hook: "Adidas Telstar",
        caption: "The iconic black and white pentagon design of footballs was introduced with the Adidas Telstar in 1970 to make the ball more visible on black-and-white televisions."
    },
    {
        id: "fb-24",
        topic: "Clubs",
        hook: "Bayern Munich's 11-in-a-row",
        caption: "Bayern Munich won 11 consecutive Bundesliga titles between 2013 and 2023, the longest title-winning streak in any of Europe's top five leagues."
    },
    {
        id: "fb-25",
        topic: "Player Records",
        hook: "Oldest Player",
        caption: "Kazuyoshi Miura, known as 'King Kazu', is one of the oldest professional footballers. He is still playing professionally in his late 50s!"
    },
    {
        id: "fb-26",
        topic: "Matches",
        hook: "El Clasico",
        caption: "The rivalry between Real Madrid and FC Barcelona is known as 'El Clasico'. It is one of the most-watched annual sporting events in the world."
    },
    {
        id: "fb-27",
        topic: "World Cup Trivia",
        hook: "Miroslav Klose",
        caption: "Germany's Miroslav Klose is the all-time leading goalscorer in FIFA World Cup history, with 16 goals across four tournaments (2002-2014)."
    },
    {
        id: "fb-28",
        topic: "National Teams",
        hook: "India's 1950 Withdrawal",
        caption: "India qualified for the 1950 World Cup but withdrew. Common legends say it was because FIFA wouldn't let them play barefoot, though financial reasons were likely the main cause."
    },
    {
        id: "fb-29",
        topic: "Managers",
        hook: "Sir Alex Ferguson",
        caption: "Sir Alex Ferguson is the most successful manager in football history, winning 49 trophies during his career, including 38 during his 26-year stint at Manchester United."
    },
    {
        id: "fb-30",
        topic: "Asian Football",
        hook: "South Korea 2002",
        caption: "In 2002, South Korea became the first Asian team to reach the semifinals of a FIFA World Cup, thanks to an incredible run on home soil."
    },
    {
        id: "fb-31",
        topic: "African Football",
        hook: "Cameroon 1990",
        caption: "Cameroon was the first African team to reach the World Cup quarterfinals in 1990, led by the 38-year-old Roger Milla and his iconic corner flag celebration."
    },
    {
        id: "fb-32",
        topic: "Stats",
        hook: "Highest Attendance",
        caption: "The 1950 World Cup final at the Maracana Stadium in Rio de Janeiro holds the record for highest attendance, with an estimated 199,854 people watching Brazil vs Uruguay."
    },
    {
        id: "fb-33",
        topic: "Rules",
        hook: "Penalty Shootouts",
        caption: "The first penalty shootout in World Cup history took place in 1982 in the semifinal between West Germany and France. West Germany won 5-4."
    },
    {
        id: "fb-34",
        topic: "Asian Football",
        hook: "Japan's J-League",
        caption: "The J-League was launched in 1993 and is credited with transforming the standard of football in Asia and making Japan a regular World Cup participant."
    },
    {
        id: "fb-35",
        topic: "Legendary Stadiums",
        hook: "Wembley Arch",
        caption: "The arch over the new Wembley Stadium is 133 meters high and 315 meters long, making it the longest single-span roof structure in the world."
    },
    {
        id: "fb-36",
        topic: "Ballon d'Or",
        hook: "First Winner",
        caption: "Stanley Matthews won the first-ever Ballon d'Or in 1956 at the age of 41! He played professional football until he was 50."
    },
    {
        id: "fb-37",
        topic: "National Teams",
        hook: "Netherlands 'Total Football'",
        caption: "The Dutch team of the 1970s, led by Johan Cruyff, revolutionized the sport with 'Total Football', where any outfield player could take the role of any other player on the pitch."
    },
    {
        id: "fb-38",
        topic: "Clubs",
        hook: "AC Milan's Defense",
        caption: "In the 1993-94 season, AC Milan won the Serie A title scoring only 36 goals in 34 games, but conceding just 15, highlighting the legendary Italian defensive style."
    },
    {
        id: "fb-39",
        topic: "Player Trivia",
        hook: "Zlatan's Goal Record",
        caption: "Zlatan Ibrahimovic has scored professional goals in every single minute of a 90-minute match (from 1st to 90th+), a extremely rare feat in world football."
    },
    {
        id: "fb-40",
        topic: "International",
        hook: "Copa America",
        caption: "The Copa America is the oldest still-running international football competition in the world, first held in 1916 to celebrate Argentina's independence."
    },
    {
        id: "fb-41",
        topic: "World Cup Trivia",
        hook: "Two Nations, One Player",
        caption: "Luis Monti is the only player to represent two different countries in two World Cup finals: Argentina in 1930 and Italy in 1934 (which he won)."
    },
    {
        id: "fb-42",
        topic: "Clubs",
        hook: "Leicester City's 5000/1",
        caption: "In 2016, Leicester City achieved the ultimate underdog story, winning the Premier League title after being given 5000-to-1 odds by bookmakers before the season."
    },
    {
        id: "fb-43",
        topic: "Matches",
        hook: "Christmas Truce Match",
        caption: "During World War I in 1914, soldiers from both British and German sides reportedly stopped fighting to play an informal game of football in 'No Man's Land'."
    },
    {
        id: "fb-44",
        topic: "Legendary Managers",
        hook: "Pep Guardiola's Sextuple",
        caption: "In 2009, Pep Guardiola's Barcelona became the first team to win six trophies in a single calendar year (The Sextuple), including the Champions League and La Liga."
    },
    {
        id: "fb-45",
        topic: "Origins",
        hook: "Ancient Football",
        caption: "While modern rules were established in England, ancient versions of football exist, such as 'Cuju' played in China over 2,000 years ago, which FIFA recognizes as the earliest form."
    },
    {
        id: "fb-46",
        topic: "Player Trivia",
        hook: "Ronaldo's World Cup Final",
        caption: "Ronaldo Nazario's 2002 World Cup comeback is legendary. After missing almost 3 years due to knee injuries, he scored 8 goals to lead Brazil to the title."
    },
    {
        id: "fb-47",
        topic: "National Teams",
        hook: "The Centenario",
        caption: "Uruguay won the first World Cup and two Olympic gold medals in the 1920s, which is why they have four stars on their jersey despite 'only' two World Cup wins."
    },
    {
        id: "fb-48",
        topic: "Player Trivia",
        hook: "Thomas Muller",
        caption: "Thomas Muller created a new position name for himself: the 'Raumdeuter' (Interpreter of Space), describing his unique ability to find space behind defenses."
    },
    {
        id: "fb-49",
        topic: "World Cup History",
        hook: "Hwang Sun-hong",
        caption: "Hwang Sun-hong scored South Korea's first ever World Cup goal in their 2002 opener against Poland, sparking a fever that consumed the entire nation."
    },
    {
        id: "fb-50",
        topic: "Legendary Clubs",
        hook: "Liverpool's Istanbul Comeback",
        caption: "In the 2005 Champions League Final, Liverpool trailed AC Milan 3-0 at halftime but scored three goals in six minutes to draw 3-3 and eventually win on penalties."
    },
    {
        id: "fb-51",
        topic: "Awards",
        hook: "Golden Boy Award",
        caption: "The Golden Boy award is given to the best U21 player in Europe. Famous winners include Wayne Rooney, Lionel Messi, and Erling Haaland."
    },
    {
        id: "fb-52",
        topic: "National Teams",
        hook: "Morocco 2022",
        caption: "Morocco became the first African and Arab nation to ever reach a FIFA World Cup semifinal during their historic run in Qatar 2022."
    },
    {
        id: "fb-53",
        topic: "Stats",
        hook: "Most Clean Sheets",
        caption: "Petr Cech holds the record for the most clean sheets in Premier League history, with 202 shutouts across his time at Chelsea and Arsenal."
    },
    {
        id: "fb-54",
        topic: "Player Trivia",
        hook: "Harry Kane",
        caption: "Harry Kane holds the record for the most goals in a single calendar year for the England national team and is their all-time leading scorer."
    },
    {
        id: "fb-55",
        topic: "Clubs",
        hook: "AFC Wimbledon",
        caption: "AFC Wimbledon was formed by fans in 2002 after the original Wimbledon FC moved to Milton Keynes. They rose from the 9th tier to the 3rd tier in just 14 years."
    },
    {
        id: "fb-56",
        topic: "World Cup Trivia",
        hook: "Just Fontaine's 13 Goals",
        caption: "France's Just Fontaine holds the record for the most goals in a single World Cup tournament, scoring 13 goals in just six games in 1958."
    },
    {
        id: "fb-57",
        topic: "Managers",
        hook: "Carlo Ancelotti",
        caption: "Ancelotti is the first manager to win the league title in all five of Europe's top leagues (Italy, Germany, France, England, and Spain) and has won 5 Champions Leagues."
    },
    {
        id: "fb-58",
        topic: "Football Science",
        hook: "Lactate Threshold",
        caption: "Modern players run up to 10-12km per match. Elite teams use GPS trackers and lactate tests to monitor recovery and ensure peak performance on matchdays."
    },
    {
        id: "fb-59",
        topic: "Champions League",
        hook: "Seedorf's Three Clubs",
        caption: "Clarence Seedorf is the only player to win the UEFA Champions League with three different clubs: Ajax, Real Madrid, and AC Milan (twice)."
    },
    {
        id: "fb-60",
        topic: "National Teams",
        hook: "The FIFA Rankings",
        caption: "The FIFA World Rankings were introduced in 1992. Since then, only 8 teams have ever held the #1 spot: Brazil, France, Germany, Argentina, Italy, Spain, Belgium, and the Netherlands."
    }
];
