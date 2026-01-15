const mysql = require('mysql2/promise');

async function initDB() {
  const connection = await mysql.createConnection({
    host: 'shuttle.proxy.rlwy.net',
    port: 11872,
    user: 'root',
    password: 'izRMafKfJifxrTcZLwTGGbamqIHdsTAB',
    database: 'railway'
  });

  console.log('Connected to MySQL');

  // Create tables
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      nickname VARCHAR(50) NOT NULL,
      life_choice TEXT NOT NULL,
      choice_category VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created users table');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL DEFAULT 0,
      author_nickname VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      tags JSON,
      likes_count INT DEFAULT 0,
      is_ai_generated BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created posts table');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL DEFAULT 0,
      author_nickname VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      is_ai_generated BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created comments table');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      post_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_like (user_id, post_id)
    )
  `);
  console.log('Created likes table');

  // Insert sample posts
  const [existing] = await connection.execute('SELECT COUNT(*) as count FROM posts');
  if (existing[0].count === 0) {
    await connection.execute(`INSERT INTO posts (user_id, author_nickname, title, content, category, tags, likes_count, is_ai_generated) VALUES (0, '星辰大海', '如果当初我没有选择考研...', '2019年大四那年，我站在了人生的十字路口。身边的室友都在准备考研，而我的心里却有另一个声音在呼唤——我想去工作，想早点经济独立。最终，我选择了直接工作，进了一家互联网公司做运营。现在回想起来，我不后悔这个选择。', 'education', '["考研", "工作", "选择"]', 128, TRUE)`);
    await connection.execute(`INSERT INTO posts (user_id, author_nickname, title, content, category, tags, likes_count, is_ai_generated) VALUES (0, '追光者', '如果当初我复读了...', '高考成绩出来那天，我哭了很久。分数比预期低了将近50分，只能上一个普通二本。但转折发生在大三，我开始认真对待自己的专业。毕业时，我拿到了一家大厂的offer。', 'education', '["高考", "复读", "逆袭"]', 256, TRUE)`);
    await connection.execute(`INSERT INTO posts (user_id, author_nickname, title, content, category, tags, likes_count, is_ai_generated) VALUES (0, '风中追梦', '如果当初我没有离开体制内...', '在国企待了五年后，我做了一个让所有人都不理解的决定——辞职创业。现在公司虽然不大，但终于稳定盈利了。最重要的是，我每天都在做自己热爱的事情。', 'career', '["创业", "国企", "选择"]', 189, TRUE)`);
    await connection.execute(`INSERT INTO posts (user_id, author_nickname, title, content, category, tags, likes_count, is_ai_generated) VALUES (0, '静待花开', '如果当初我没有分手...', '大学毕业那年，我和初恋分手了。原因很简单，异地。但随着时间推移，我遇到了现在的老公，有了可爱的孩子，才明白有些人注定只能陪你走一段路。', 'relationship', '["爱情", "异地", "释怀"]', 423, TRUE)`);
    await connection.execute(`INSERT INTO posts (user_id, author_nickname, title, content, category, tags, likes_count, is_ai_generated) VALUES (0, '向阳而生', '如果当初我没有回老家照顾父母...', '三十岁那年，父亲被查出癌症晚期。我没有犹豫，辞掉了工作回到老家。那半年，我每天陪父亲聊天、散步。他走的那天，握着我的手说：闺女，爸爸这辈子值了。', 'family', '["亲情", "父母", "陪伴"]', 678, TRUE)`);
    await connection.execute(`INSERT INTO posts (user_id, author_nickname, title, content, category, tags, likes_count, is_ai_generated) VALUES (0, '梦想家', '如果当初我没有来大城市...', '十年前，我拖着一个行李箱来到北京。那时候身上只有2000块钱。但我坚持下来了。现在的我，有了自己的房子，有了值得奋斗的事业。', 'relocation', '["北漂", "奋斗", "坚持"]', 567, TRUE)`);
    console.log('Inserted sample posts');

    await connection.execute(`INSERT INTO comments (post_id, user_id, author_nickname, content, is_ai_generated) VALUES (1, 0, '淡然微笑', '我也是没考研直接工作的，现在觉得当时的选择挺对的。', TRUE)`);
    await connection.execute(`INSERT INTO comments (post_id, user_id, author_nickname, content, is_ai_generated) VALUES (2, 0, '小太阳', '高考失利不可怕，可怕的是就此沉沦。楼主的故事很励志！', TRUE)`);
    console.log('Inserted sample comments');
  }

  await connection.end();
  console.log('Database initialized successfully!');
}

initDB().catch(console.error);
