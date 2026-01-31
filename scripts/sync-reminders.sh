#!/bin/bash
# Sync Apple Reminders to Command Center API
# Runs via launchd on a schedule

API_URL="https://dashboard.bode.design/api/reminders"

# Use JavaScript for Automation (JXA) to get reminders from multiple lists
JSON=$(osascript -l JavaScript << 'EOF'
const Reminders = Application("Reminders");
const listNames = ["Family", "McCOY", "KNOX", "RIPLEY"];

let allReminders = [];

listNames.forEach(listName => {
    const lists = Reminders.lists.whose({name: listName});
    if (lists.length > 0) {
        const list = lists[0];
        const reminders = list.reminders.whose({completed: false})();

        reminders.forEach(r => {
            let dueDate = null;
            try {
                if (r.dueDate()) {
                    dueDate = r.dueDate().toISOString();
                }
            } catch(e) {}

            allReminders.push({
                id: r.id(),
                title: r.name(),
                notes: r.body() || null,
                dueDate: dueDate,
                priority: r.priority(),
                isCompleted: r.completed(),
                list: listName
            });
        });
    }
});

JSON.stringify({reminders: allReminders});
EOF
)

# Check if we got valid JSON
if [ -z "$JSON" ] || [ "$JSON" = "null" ]; then
    echo "$(date): Failed to get reminders from Reminders.app"
    exit 1
fi

# POST to the API
RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$JSON")

echo "$(date): Synced reminders - $RESPONSE"
