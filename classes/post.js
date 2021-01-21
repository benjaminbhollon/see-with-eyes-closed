const bcrypt = require("bcryptjs");
const fetch = require('isomorphic-fetch'), bodyParser = require('body-parser');

//Import config
const config = require('./config.json');

class Post {
  constructor(request, response) {
    this.request = request;
    this.response = response;
    //Define templates with no extra processing
    this.finishedTemplates = config.finishedTemplates;
  }

  add_comment() {
    //Add comment
    app.post("/blog/article/:articleId/comment", async function () {
      if (!this.request.body.name || !this.request.body.comment || (this.request.body.comment && this.request.body.comment.length > 512) || (this.request.body.name && this.request.body.name.length > 128)) return response.redirect(302, "/blog/article/" + this.request.params.articleId + "/#comment-form?err=" + 400 + "&name=" + encodeURIComponent(this.request.body.name) + "&comment=" + encodeURIComponent(this.request.body.comment));
      var reCAPTCHAvalid = false;
      await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${config.reCAPTCHAprivate}&response=${this.request.body["g-recaptcha-response"]}`, {
        method: 'post'
      }).then(result => result.json()).then(google_response => reCAPTCHAvalid = google_response);
      if (!reCAPTCHAvalid) return this.response.redirect(302, "/blog/article/" + this.request.params.articleId + "/#comment-form?err=" + 401 + this.request.params.articleId + "&name=" + encodeURIComponent(this.request.body.name) + "&comment=" + encodeURIComponent(this.request.body.comment));

      var article;
      await findDocument("articles", {"id": this.request.params.articleId}).then(result => {
        article = result;
      });
      if (article === null) this.response.status(404).end();

      if (this.request.session.identifier == undefined) this.request.session.identifier = Math.floor(Math.random() * 8999999) + 1000000;
      article.comments.push({"identifier": await bcrypt.hash(this.request.session.identifier.toString(), bcryptSalt), "author": this.request.body.name, "message": this.request.body.comment, "time": Math.floor(Date.now() / 1000)});
      updateDocument("articles", {"id": this.request.params.articleId.toString()}, {"comments": article.comments});

      this.response.redirect(302, "/blog/article/" + this.request.params.articleId + "/#comment-form");
    });
  }

  subscribe() {
    //Subscribe
    app.post("/blog/subscribe/", async function () {
      if (!validEmail(this.request.body.email)) return this.response.render("subscribe", {"success": false, "message": "You must provide a valid email address."});

      var check;
      await findDocument("subscribers", {"email": this.request.body.email.toLowerCase()}).then(result => {
        check = result;
      });
      if (check !== null) return this.response.render("subscribe", {"success": false, "message": "You're already subscribed. If you haven't been receiving updates, <a href='/contact/'>contact me</a> and we'll figure it out."});

      var subscribeObject = {
        "name": this.request.body.name.toString(),
        "email": this.request.body.email.toLowerCase(),
        "subscribedTo": {
          "blog": true
        }
      }

      await insertDocument("subscribers", subscribeObject);

      var message = {
        from: 'Benjamin Hollon <benjamin@seewitheyesclosed.com>',
        to: subscribeObject.email,
        subject: "You've been subscribed!",
        html: `<h1>Success! You have been subscribed!</h1>
        <p>You are now receiving email updates from the See With Eyes Closed Blog. I'm so glad to have you! I try to release a blog post every week or so, though I often forget and occasionally have even more to say.

        <p>If you didn't ask to be subscribed or you've reconsidered, you can easily <a href='https://seewitheyesclosed.com/blog/unsubscribe/?email=` + subscribeObject.email +`&token=` + (await bcrypt.hash(subscribeObject.email, 1)) + `'>unsubscribe</a>.</p>`
      };
      await transporter.sendMail(message, function(err) {
        if (err) {
          console.log(err)
        }
      });

      this.response.redirect(302, "/blog/?justSubscribed=true");
    });
  }

  create_article() {
    //Create article
    app.post("/admin/post/article/", async function () {
      var today = new Date();
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      var article = {
        id: this.request.body.id,
        title: this.request.body.title,
        author: this.request.body.author,
        date: months[today.getMonth()] + " " + today.getDate() + ", " + today.getFullYear(),
        image: this.request.body.image.toString(),
        summary: this.request.body.summary,
        content: this.request.body.content,
        tags: this.request.body.tags.split(",").map(tag => tag.trim()),
        comments: (this.request.body.comments ? [] : false),
        hits: 0
      };

      await insertDocument("articles", article);

      this.response.redirect(302, "/blog/article/" + this.request.body.id + "/");
    });
  }

  contact() {
    //Contact me
    app.post("/contact/send/", async function () {
      var message = {
        from: 'noreply@seewitheyesclosed.com',
        to: config.email,
        subject: this.request.body.subject.toString(),
        text: "Message from " + this.request.body.email.toString() + ":" + this.request.body.message.toString()
      };
      await transporter.sendMail(message, function(err) {
        if (err) {
          console.log(err)
        }
      });

      this.response.redirect(302, "/contact/?success=true");
    });
  }

  policies() {
    //Policies
    app.get("/policies/:policy/", function () {
      var policies = {
        "privacy": {
          "title": "Privacy Policy",
          "description": "The privacy policy for the See With Eyes Closed website and blog.",
          "markdown": `# Privacy Policy
    I care about your privacy. I promise that no matter what you do on this website, I will be doing the most I possibly can to ensure your safety.

    I only collect information you give me with the understanding that I will store it and only use it for the reason you give it to me. I don't use any creepy trackers or analytics programs to gather information about you. The only information I gather is how many people visit each article. I don't even keep track of who it is that visits them.

    Part of this is because I'm too lazy to collect more info than I do, but most of it is because I don't like it when websites collect my data, so I won't collect yours.

    That being said, I may have to use scripts from other websites on occasion (including but not limited to embedded Youtube videos and Google reCAPTCHA) that do collect information. This privacy policy does not apply to them and you should see their individual privacy policies. If you worry about these websites, I recommend installing some sort of blocker for their trackers. I use and recommend [Brave Browser](https://brave.com), which automatically blocks all ads and trackers.

    If you have any concerns about your data or privacy, please [contact me](/contact/) and I'll try to assist you.

    This policy is effective as of March 26 2020.`,
          "related": [
            {"name": "Cookie Policy", "link": "/policies/cookies/"},
            {"name": "Terms of Use", "link": "/policies/terms/"}
          ]
        },
        "cookies": {
          "title": "Cookie Policy",
          "description": "The cookie policy for the See With Eyes Closed website and blog.",
          "markdown": `# Cookie Policy

    ### What Are Cookies?
    Cookies are small text files that websites store on your computer to help remember information about you (usually to make your experience better). For example, if you ever click "remember me" on a login page, the website uses a cookie to remember you.

    ### The Cookies I Use
    I use very few cookies and none of them are personally identifying unless I specifically tell you otherwise. Disabling cookies will not break my website. However, you may be annoyed because the "accept our cookie policy" and "subscribe for blog updates" banners will keep appearing, no matter how many times you dismiss them. This is because I have to use cookies to remember if you've seen it before.

    ### Third-Party Cookies
    Sometimes, I need to use scripts or services from other websites. Some of these (including but not limited to embedded Youtube videos and Google reCAPTCHA) set cookies. This cookie policy does not apply to them and you should see their individual cookie policies.

    ### Disabling Cookies
    It is possible to disable cookies in your browser settings (the method differs by the browser, look up yours). Although this will not, for the most part, break my site (see above), it may break other websites, and I don't recommend you disable cookies, as they're usually just to help you out.

    I would, however, recommend blocking cross-site cookies, as these can track you between the different sites you visit. I use and recommend the [Brave browser](https://brave.com/) for this.

    ### More Information

    I hope this cleared up any questions you had. To sum up: I hardly use cookies, and never with personal information unless I specifically tell you; some external scripts or services may set cookies, so be careful about that; and it is possible to disable cookies, but you probably won't like the result.

    If you still have questions, you can [contact me](/contact/) and I'll work to help you resolve them.

    This policy is effective as of March 26 2020.`,
          "related": [
            {"name": "Privacy Policy", "link": "/policies/privacy/"},
            {"name": "Terms of Use", "link": "/policies/terms/"}
          ]
        },
        "terms": {
          "title": "Terms of Use",
          "description": "The terms of use for the See With Eyes Closed website and blog.",
          "markdown": `# Terms of Use
    ### 1. Terms

    First, I have to use some fancy legal jargon.

    By accessing the website at [https://seewitheyesclosed.com](https://seewitheyesclosed.com), you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.

    In other words, don't download anything from my website unless I tell you that it's okay. That's super not cool and against the law besides.
    ### 2. Use License
    Here comes some more legal terms, but I'll summarize afterward.
    <ol type="a">
      <li>
        Permission is granted to temporarily download one copy of the materials (information or software) on See With Eyes Closed's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
        <ol type="i">
          <li>modify or copy the materials;</li>
          <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
          <li>attempt to decompile or reverse engineer any software contained on See With Eyes Closed's website;</li>
          <li>remove any copyright or other proprietary notations from the materials; or</li>
          <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
        </ol>
      </li>
      <li>This license shall automatically terminate if you violate any of these restrictions and may be terminated by See With Eyes Closed at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.</li>
    </ol>

    Basically, you can view the content on the website, but don't download it, change it, try to sell it or pass it off as your own, decompile any of the scripts that I use unless I give you the code, take off copyright notices, or give a copy to other people except through a link to the website.

    ### 3. Disclaimer
    Here we go again...
    <ol type="a">
      <li>The materials on See With Eyes Closed's website are provided on an 'as is' basis. See With Eyes Closed makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</li>
      <li>Further, See With Eyes Closed does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.</li>
    </ol>

    So, if there's an error with my website, too bad. It's a take it or leave it situation. However, if you do find an error, I'd like to hear about it, so don't hesitate to [contact me](/contact/).

    ### 4. Limitations
    In no event shall See With Eyes Closed or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on See With Eyes Closed's website, even if See With Eyes Closed or a See With Eyes Closed authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.

    If something happens to you because my website doesn't work properly, I apologize, but it's really not my fault.

    ### 5. Accuracy of Materials
    The materials appearing on See With Eyes Closed's website could include technical, typographical, or photographic errors. See With Eyes Closed does not warrant that any of the materials on its website are accurate, complete or current. See With Eyes Closed may make changes to the materials contained on its website at any time without notice. However See With Eyes Closed does not make any commitment to update the materials.

    In other words, I'm human. I make mistakes. Things I post might not be right, so take it all with a grain of salt.

    ### 6. Links
    See With Eyes Closed has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by See With Eyes Closed of the site. Use of any such linked website is at the user's own risk.

    Another way of saying this is that I can't be responsible for any other websites, even if I link to them, so use them at your own risk.

    ### 7. Modifications
    See With Eyes Closed may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.

    I may have to change this from time to time and I may not be able to contact you. But you don't need to worry about that, because you are only responsible for the terms as they are when you are browsing.

    These terms and conditions effective as of 26 March 2020.`,
          "related": [
            {"name": "Privacy Policy", "link": "/policies/privacy/"},
            {"name": "Cookie Policy", "link": "/policies/cookies/"}
          ]
        }
      }

      if (policies[this.request.params.policy] === undefined) return this.response.status(204).end();
      else this.response.render("policy", policies[this.request.params.policy])
    });
  }
}

module.exports = Post;