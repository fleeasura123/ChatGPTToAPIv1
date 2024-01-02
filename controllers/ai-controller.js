const { htmlToText } = require('html-to-text');

async function setSelectVal(sel, val) {
    g_page.evaluate((data) => {
        const input = document.querySelector(data.sel);
        return input.value = data.val
    }, {sel, val})
}

g_app.get('/', async (req, res) => {
    return res.json({
        success: true
    });
});

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

const chat = async (question) => {
    // Type the question you want in ChatGPT message input
    const textarea = await g_page.waitForSelector('textarea[tabindex="0"]');

    await setSelectVal('textarea[tabindex="0"]', question);

    await textarea.type(' ');
    
    // Click the send message button
    const button = await g_page.waitForSelector('textarea[tabindex="0"]~button');
    await button.click();
    
    await g_page.waitForSelector('textarea[tabindex="0"]~button[disabled]');
    
    await sleep(getRandomNumber(1,2) * 1000);

    // Extract the inner HTML of the last matching element
    const lastElementHTML = await g_page.evaluate(() => {
        const elements = document.querySelectorAll('[data-message-author-role="assistant"]');
        const lastElement = elements[elements.length - 1];
        return lastElement.innerHTML;
    });

    const text = htmlToText(lastElementHTML, {
        wordwrap: false
    });
    
    return text;
}

g_app.post('/api/ai', async (req, res) => {
    try {

        // ChatGPT can answer questions 1 at a time
        if(!g_isFinishedAnswering)
            return res.json({
                success: false,
                message: 'AI is not done answering the previous question'
            });

        // await g_page.reload();
        // await waitForLoading();

        g_isFinishedAnswering = false;
        
        const question = req.body.content.trim();
        
        const questionClean = htmlToText(question, {
            wordwrap: false
        });
        
        const answer = await chat(questionClean);

        g_isFinishedAnswering = true;

        return res.json({
            success: true,
            data: {
                question,
                answer
            }
        });
    } catch (err) {
        console.log(err);
        g_isFinishedAnswering = true;

        return res.json({
            success: false,
            message: 'Something went wrong'
        });
    }
});