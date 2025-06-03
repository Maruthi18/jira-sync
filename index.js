const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- Configuration ---
const JIRA_A_BASE_URL = "https://maruthiprasad123.atlassian.net";
const JIRA_B_BASE_URL = "https://codewithsmp.atlassian.net";
const JIRA_A_EMAIL = process.env.JIRA_A_EMAIL;
const JIRA_B_EMAIL = process.env.JIRA_B_EMAIL;
const JIRA_A_TOKEN = process.env.JIRA_A_TOKEN;
const JIRA_B_TOKEN = process.env.JIRA_B_TOKEN;
const AUTH_A = Buffer.from(`${JIRA_A_EMAIL}:${JIRA_A_TOKEN}`).toString('base64');
const AUTH_B = Buffer.from(`${JIRA_B_EMAIL}:${JIRA_B_TOKEN}`).toString('base64');

const HEADERS_B = {
  'Authorization': `Basic ${AUTH_B}`,
  'Content-Type': 'application/json'
};

const issueMap = {}; // Use DB in real use cases

app.post('/webhooks/webhook1', async (req, res) => {
  const payload = req.body;
  const issueKey = payload?.issue?.key;
  const summary = payload?.issue?.fields?.summary;
  const description = payload?.issue?.fields?.description;

  if (!issueKey) {
    return res.status(400).json({ status: 'No issue key' });
  }

  if (issueMap[issueKey]) {
    return res.status(200).json({ status: 'Already synced' });
  }

  const createIssueUrl = `${JIRA_B_BASE_URL}/rest/api/3/issue`;
  const data = {
    fields: {
      project: { key: 'SPB' }, // Replace with your Jira B project key
      summary: `[Synced from Jira A] ${summary}`,
      description: description,
      issuetype: { name: 'Task' }
    }
  };

  try {
    const response = await axios.post(createIssueUrl, data, { headers: HEADERS_B });
    issueMap[issueKey] = response.data.key;
    res.status(201).json({ status: 'Issue created in Jira B', jira_b_key: response.data.key });
  } catch (error) {
    res.status(500).json({ status: 'Failed to create issue', details: error.response?.data || error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Jira Sync Middleware Running' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
