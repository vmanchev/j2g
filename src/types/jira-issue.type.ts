export type JiraIssue = {
    id: string;
    key: string;
    fields: {
        summary: string;
        issuetype: {
            name: string;
        }
    };
}