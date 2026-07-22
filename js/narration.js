// Page narration script. Every word here is drawn from this site's own
// published copy, lightly joined for the ear (abbreviations spelled out, dashes
// turned into pauses). Nothing is invented.
//
// Shared by the browser player (js/narration-player.js) and the audio
// pre-generator (scripts/narrate.mjs), so the spoken words and the generated
// mp3 files can never drift apart.
//
// Each section's `anchor` matches a [data-narrate="..."] block on the page,
// which is scrolled to and gently highlighted while that part is read.
// Keep each `text` under 800 characters: that is the cap on /api/tts.

export const narration = {
  '/': {
    title: 'Home',
    sections: [
      {
        id: 'welcome',
        anchor: 'hero',
        title: 'Welcome',
        text: "Hi, I'm Roger Loomis. Let's grow together in faith. This site is practical wisdom and encouragement for your ministry and everyday life. I have pastored six churches over the last five decades, and like all church leaders, have taken my lumps. Instead of playing the victim, I want to share not only my ministry experiences but also offer several resources to bless you.",
      },
      {
        id: 'ask-roger',
        anchor: 'ask-roger',
        title: 'Ask Roger',
        text: "Have a question? Just ask Roger. Roger has spent nearly five decades pastoring, writing, and walking with people through life. Now you can ask him a question and get an answer drawn straight from his books and blog, like sitting down with him over coffee. Answers come only from Roger's books and blog.",
      },
      {
        id: 'featured-book',
        anchor: 'featured-book',
        title: 'Healing Our Broken Places',
        text: "Healing Our Broken Places. Helping one another to reach our full potential in Christ as we allow God to heal our wounded soul. Many believers love Jesus deeply, yet still carry wounds, patterns, and struggles that don't seem to go away. Roger Loomis addresses the often overlooked reality that salvation and healing are not the same thing. With biblical clarity, pastoral wisdom, and real life insight, this book offers a clear and compassionate path toward restoration. You are saved. And you don't have to stay broken.",
      },
      {
        id: 'books',
        anchor: 'books',
        title: 'Books for ministry and life',
        text: "Books for ministry and life. Raising Parents Is Tough offers practical, Scripture based advice to help parents guide their children with love and integrity at every stage. Monday Morning Preacher covers forty real world issues pastors encounter, many not covered in Bible school, with practical chapters and reflection questions drawn from forty three years of pastoral experience. Running Your Race covers salvation, spiritual disciplines, and summaries of every book in the Bible, helping believers stay the course and finish strong in their faith.",
      },
      {
        id: 'about',
        anchor: 'about',
        title: 'About Roger and Lori',
        text: "Forty three years of pastoral experience. Roger and Lori Loomis bring over forty three years of pastoral experience to their ministry and family life. Graduates of Evangel University, with postgraduate work at Liberty University, they have pastored six churches across North Carolina, Alabama, and Ohio. Currently, they lead Hope Community Church, a nondenominational congregation they founded in Jefferson, Ohio. Roger and Lori are ordained through the E four Ministry Network and are proud parents of four children and grandparents to nine.",
      },
      {
        id: 'newsletter',
        anchor: 'newsletter',
        title: 'Stay in touch',
        text: "Receive occasional notes for faith, family, and leadership. Join Roger's free email list for thoughtful encouragement, ministry reflections, and practical resources sent occasionally to your inbox. No spam, just occasional encouragement and updates.",
      },
    ],
  },

  '/about': {
    title: 'About Roger',
    sections: [
      {
        id: 'intro',
        anchor: 'hero',
        title: 'About Roger Loomis',
        text: "About Roger Loomis. Pastor. Author. Speaker. Husband. Father. Grandfather.",
      },
      {
        id: 'story',
        anchor: 'story',
        title: 'His story',
        text: "Roger and Lori Loomis bring over forty three years of pastoral experience to their ministry and family life. Graduates of Evangel University, with postgraduate work at Liberty University, they have pastored six churches across North Carolina, Alabama, and Ohio. Currently, they lead Hope Community Church, a nondenominational congregation they founded in Jefferson, Ohio. Roger and Lori are ordained through the E four Ministry Network and are proud parents of four children and grandparents to nine.",
      },
      {
        id: 'heart',
        anchor: 'story',
        title: 'His heart',
        text: "Roger's heart is simple: to resource leaders so they can encourage others. He writes and speaks from the trenches of real ministry, not from a distance, but from decades of showing up, making mistakes, learning, and pressing forward in faith. His books reflect that same spirit. Honest, practical, and grounded in Scripture. Whether you are a new pastor navigating your first call, a seasoned leader facing modern challenges, or a committed follower of Christ looking to go deeper, Roger's work meets you where you are.",
      },
      {
        id: 'credentials',
        anchor: 'credentials',
        title: 'Credentials',
        text: "Credentials and ministry highlights. An undergraduate degree in ministry and theology from Evangel University. Postgraduate studies in Christian leadership at Liberty University. Six churches pastored across North Carolina, Alabama, and Ohio. An ordained minister in good standing with the E four Ministry Network. Founder and lead pastor of Hope Community Church in Jefferson, Ohio. And four published books on ministry, parenting, healing, and discipleship.",
      },
      {
        id: 'timeline',
        anchor: 'timeline',
        title: 'A life of faithful service',
        text: "A life of faithful service. Roger graduated from Evangel University and completed postgraduate work at Liberty University, building a strong theological and leadership foundation. He began pastoral ministry in the Southeast, leading congregations through growth, challenge, and transformation across two states. He continued pastoral work in Ohio, eventually planting Hope Community Church in Jefferson, a nondenominational congregation built on biblical truth and community. Today Roger and Lori continue to lead that church, create weekly content for pastors and believers, and invest in their four children and nine grandchildren.",
      },
    ],
  },

  '/books': {
    title: 'Books',
    sections: [
      {
        id: 'intro',
        anchor: 'hero',
        title: 'Books by Roger Loomis',
        text: "Books by Roger Loomis. Written to resource and encourage. For pastors, church leaders, parents, and serious Christ followers.",
      },
      {
        id: 'healing',
        anchor: 'healing',
        title: 'Healing Our Broken Places',
        text: "Healing Our Broken Places. Many believers love Jesus deeply, yet still carry wounds, patterns, and struggles that don't seem to go away. Why is that? Roger addresses the often overlooked reality that salvation and healing are not the same thing. While our spirit is made new in Christ, our soul, our mind, will, and emotions, may still carry pain from the past. This book helps you understand the difference between salvation and soul healing, identify hidden wounds, break free from cycles of pain and fear, and walk in the fullness of life that Jesus promised. You are saved. And you don't have to stay broken.",
      },
      {
        id: 'raising-parents',
        anchor: 'raising-parents',
        title: 'Raising Parents Is Tough',
        text: "Raising Parents Is Tough. A practical guide to biblical parenting. Parenting doesn't come with a handbook, until now. Packed with wisdom, humor, and real world advice, this book offers practical tools for raising children with love, integrity, and biblical principles. Written by Roger Loomis, a pastor, husband, father of four, and grandfather, it covers everything from disciplining toddlers to navigating teen challenges, managing blended families, and embracing the empty nest.",
      },
      {
        id: 'monday-morning',
        anchor: 'monday-morning',
        title: 'Monday Morning Preacher',
        text: "Monday Morning Preacher. Lessons for navigating ministry challenges. Pastors face unique and often overlooked challenges in today's church environment. This book explores forty real world issues, from declining attendance to internal conflicts, that pastors must identify and address to strengthen their churches. With practical insights, reflection questions, and wisdom from forty three years of ministry, Roger offers a guide for both new and seasoned pastors to navigate their calling with clarity and purpose.",
      },
      {
        id: 'running-your-race',
        anchor: 'running-your-race',
        title: 'Running Your Race',
        text: "Running Your Race. A foundation for serious Christ followers. This guide lays a foundation for understanding the Bible and living out the Christian life as a race. Covering salvation, spiritual disciplines, and summaries of every book in the Bible, this manual helps believers stay the course and finish strong in their faith. Printed copies are available for group studies. Contact Roger for pricing.",
      },
      {
        id: 'who-for',
        anchor: 'who-for',
        title: 'Who these books are for',
        text: "Written for leaders, pastors, and followers of Christ. These books are for pastors, church leaders, and anyone passionate about supporting the local church. Whether you are a new pastor navigating your first ministry, a seasoned leader facing modern challenges, a committed follower of Christ, or a church member wanting to understand and strengthen your congregation, these books offer practical insights and teaching for everyone. They are especially helpful for those leading or attending smaller churches who want to build healthier, more enduring ministries.",
      },
    ],
  },

  '/blog': {
    title: 'Blog',
    sections: [
      {
        id: 'intro',
        anchor: 'hero',
        title: "Roger's Blog",
        text: "Roger's blog. Encouragement and insight. Practical advice, biblical wisdom, and real life insights for faith and ministry.",
      },
      {
        id: 'archive',
        anchor: 'archive',
        title: 'Browse every post',
        text: "Browse every post. Roger writes on topics that matter to pastors, church leaders, parents, and serious followers of Christ. Search by keyword or filter by topic to find what speaks to you. The topics are faith and salvation, church life, Christian living, leadership, family, and healing.",
      },
    ],
  },

  '/contact': {
    title: 'Get In Touch',
    sections: [
      {
        id: 'intro',
        anchor: 'hero',
        title: 'Get in touch',
        text: "Get in touch. We're here to help. Have questions, need guidance, or just want to connect? We'd love to hear from you.",
      },
      {
        id: 'talk',
        anchor: 'talk',
        title: "Let's talk",
        text: "Let's talk. Whether you have a question about one of Roger's books, want to inquire about speaking engagements, or simply want to reach out and connect, this is the place. Roger and his team do their best to respond to every message.",
      },
      {
        id: 'form',
        anchor: 'form',
        title: 'Send a message',
        text: "Send a message. Fill out the form below and Roger's team will be in touch soon.",
      },
    ],
  },
};

export default narration;
