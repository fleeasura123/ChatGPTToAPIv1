async function setSelectVal(sel, val) {
    g_page.evaluate((data) => {
        const input = document.querySelector(data.sel);
        return input.value = data.val
    }, {sel, val})
}

g_app.post('/api/ai', async (req, res) => {
    try {

        // ChatGPT can answer questions 1 at a time
        if(!g_isFinishedAnswering)
            return res.json({
                success: false,
                message: 'AI is not done answering the previous question'
            });

        g_isFinishedAnswering = false;
        
        const question = req.body.content;
        let answer = null;
        
        // Type the question you want in ChatGPT message input
        const textarea = await g_page.waitForSelector('textarea[tabindex="0"]');

        await setSelectVal('textarea[tabindex="0"]', question);

        await textarea.type(' ');
        
        // Click the send message button
        const button = await g_page.waitForSelector('textarea[tabindex="0"]~button');
        await button.click();
        
        // First request is your question only
        await g_page.waitForRequest('https://chat.openai.com/backend-api/moderations');

        // Second request is your question with answer
        const secondRequest = await g_page.waitForRequest('https://chat.openai.com/backend-api/moderations');
        
        // The question and answer is in the payload of the second request
        const payload = secondRequest.postData();
        const payloadJson = JSON.parse(payload);
        
        // Split by question to get the latest answer in the last index of the array
        const answers = payloadJson.input.split(question);
        
        // Latest answer
        answer = answers[answers.length - 1].trim();

        g_isFinishedAnswering = true;

        return res.json({
            success: true,
            data: {
                question,
                answer
            }
        });
    } catch (err) {

        g_isFinishedAnswering = true;

        return res.json({
            success: false,
            message: 'Something went wrong'
        });
    }
});