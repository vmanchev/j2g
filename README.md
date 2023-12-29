# j2g

Create a git branch name from Jira ticket code. 

## Table of Contents
1. [Intro](#intro)
2. [Install](#install)
3. [How it works](#how-it-works)
4. [Configuration](#configuration)
5. [Features](#features)
    - [Create new configuration](#create-new-configuration)
    - [Print configuration](#print-configuration)
    - [Reset configuration](#reset-configuration)
    - [Create branch name](#create-branch-name)
    - [Copy to clipboard](#copy-to-clipboard)
    - [Create Git branch](#create-git-branch)
    - [Remove project](#remove-project)
    - [Set new token](#set-new-token)
6. [Help](#help)
    - [Main help screen](#main-help-screen)
    - [Per command help](#per-command-help)

<a name="intro"></a>
## Intro
It transforms a Jira ticket code into a git branch name with the following structure:

```
[feature|bugfix]/[ticket-code]-[ticket-title]
```

For example, Jira ticket of type "issue" with code "ABC-123" and title "User profile form" will output:

```
j2g ABC-123

┌ branch name: ─────────────────────────┐
│                                       │
│   feature/ABC-123-user-profile-form   │
│                                       │
└───────────────────────────────────────┘
```

<a name="install"></a>
## Install

Install `j2g` in npm's global scope and use it in any of your local git repositories.

```
npm install -g j2g
```

<a name="how-it-works"></a>
## How it works

> It works only inside a git project folder

1. Connects to your Jira's REST API to retrieve Jira issue data.
2. Using issue type, it decides on the prefix - `feature` or `bugfix`.
3. Using issue title, it will:
    - transform the title to lower-case;
    - remove any characters apart from letters and numbers;
    - will replace all spaces with dash;

<a name="configuration"></a>
## Configuration

Once installed, you need to configure `j2g` in order to use it. 

Start with running:

```
$ cd /path/to/project
$ j2g config
```
If no Jira board configurations were found, it will ask you to create the first one with the following questions: 
- Jira access token. To get one: 
    1. login to your Jira board
    2. Go to your Profile
    3. Click on "Personal Access Tokens"
    4. Click on "Create token"
    5. Token name is irrevant. For "Expiry date" you might want to untick the 
    "Automatic expiry" checkbox and benefit from life-long configuration settings. 
    Should you chose to play safe and keep the automatic token expiration, `j1g` 
    will inform your when token is expired and you will need to run the configuration command again.
    6. Finally, copy the newly-generated token and pass it to `j2g`
- Base Jira board url. This is just the base url, something like `https://jira.example.org`, 
the root URL where your Jira works.

All this data is stored in `$HOME/.config/configstore/j2g.json` file. You can have unlimited projects 
under one Jira board configuration. Project identifier is the project root path.

If at least one Jira board configuration is found, you will be able to select an existing one to add this 
project to or to create a new Jira Board configuration. 

<a name="features"></a>
## Features

<a name="create-new-configuration"></a>
### Create new configuration
```
$ cd /path/to/project
$ j2g config
```


<a name="print-configuration"></a>
### Print configuration

```
$ j2g config --print
┌────────────┬───────────────────────────┐
│ Jira Board │ https://jira.example.org  │
├────────────┼───────────────────────────┤
│ Projects   │ /path/to/project-a        │
│            │ /path/to/project-b        │
│            │ /path/to/project-c        │
└────────────┴───────────────────────────┘

┌────────────┬───────────────────────────────┐
│ Jira Board │ https://jira-board.test.com   │
├────────────┼───────────────────────────────┤
│ Projects   │ -                             │
└────────────┴───────────────────────────────┘
```

<a name="reset-configuration"></a>
### Reset configuration

As this command would reset the global j2g configuration, you will be prompt for confirmation.

```
$ j2g config --reset
[info] Global j2g configration removed
```


### Create branch name
<a name="create-branch-name"></a>

Generates and prints a git branch name from Jira ticket code  

> Note: Although the full command would be `j2g create ABC-123`, beeing the default 
command, you don't have to type it all the time, just pass a Jira ticket code.  

```
$ j2g ABC-123

┌ branch name: ─────────────────────────┐
│                                       │
│   feature/ABC-123-user-profile-form   │
│                                       │
└───────────────────────────────────────┘
```


### Copy to clipboard
<a name="copy-to-clipboard"></a>

Optionally, copy the newly-created branch name into your clipboard.
   
```
$ j2g ABC-123 -c // or --copy

┌ branch name: ─────────────────────────┐
│                                       │
│   feature/ABC-123-user-profile-form   │
│                                       │
└───────────────────────────────────────┘
[info] Branch name is copied to your clipboard
```

### Create Git branch
<a name="create-git-branch"></a>

Optionally, also create a git branch from selected source branch.  
    
When you want not only the branch name to be generated, but also the branch it self to be 
created, `j2g` will perform the following git commands:  

- `git stash` - to make sure your current branch is clean
- `git checkout SOURCE_BRANCH` and if not exists - prints an error message and exits here.
- `git pull` - only if `SOURCE_BRANCH` is a remote git branch.
- `git checkout -b NEW_BRANCH_NAME` - to actually creates your new git branch. If a local 
branch with that name already exists, it will print an error message and will keep you in 
`SOURCE_BRANCH`

```
$ j2g ABC-123 -s master // or --source master

┌ branch name: ─────────────────────────┐
│                                       │
│   feature/ABC-123-user-profile-form   │
│                                       │
└───────────────────────────────────────┘
[info] Branch created!
```


### Remove project  
<a name="remove-project"></a>

`j2g` will detect the project is part of a Jira board configuration and will ask you what to do. Select "Remove it and exit".

```
$ cd /path/to/project
$ j2g config
[info] Current project is not part of any j2g configuration
```

### Set new token 
<a name="set-new-token"></a>

Use this command to provide new token for selected Jira board. You will be prompt to select the Jira board for this new token.

```
$ j2g config --token
```

## Help
<a name="help"></a>

### Main help screen
<a name="main-help-screen"></a>

```
$ j2h --help
Usage: j2g [command] [options]

Create new git branch from Jira ticket code

Options:
-V, --version                   output the version number
-h, --help                      display help for command

Commands:
create [options] <ticket-code>  Create new branch name
config [options]                Configure configuration for this repo
help [command]                  display help for command
```

### Per command help
<a name="per-command-help"></a>


```
$ j2g create --help
Usage: j2g create [options] <ticket-code>

Create new branch name

Arguments:
ticket-code                   Jira ticket code, e.g. ABC-123

Options:
-s, --source <source-branch>  Also create a git branch from source-branch
-c, --copy                    Copy branch name to clipboard
-h, --help                    display help for command
```