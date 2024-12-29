# Play by post helper

A tool to help manage Starfinder games played by post. The core functionality is an initiative tracker.

This software uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (paizo.com/licenses/communityuse). We are expressly prohibited from charging you to use or access this content. This software is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit paizo.com.

## Requirements

This is a web application. You'll require a sever with the following requirement:

* PHP: 8.3.0 tested but almost any version should work.
* MySQL: 8.2.0 tested
* PDO driver: Almost certainly included in your PHP installation.

You can easily test or run the PbP helper locally through a local server. For example, https://www.uniformserver.com/.

## Installation

1. Create a database on the server.
2. Create a user account that has CREATE, SELECT, INSERT, and UPDATE priviledges for the database. In the near future, most likely DELETE as well.
3. Copy the PbP helper files to your server.
4. In a browser, access the /setup/index.php file.
5. Enter all of the required information, and then select **Submit**.

If the installation completes sucessfully, delete the setup setup/index.php file from your server.

If anything goes wrong, correct the issue, drop any tables that were created, and then try again.

## Security

Security is minimal. The application is intended to be used by a single user and not contain any sensitive information.

When you install the application, you will set a "password". You use this password to access the application.

## Usage

The application has three main sections.

* Encounter templates: These define the creatures that are included in a specific encounter.
* Teams: These define a group of adventurers.
* Encounters: An initiative and round tracker that combines a team and an encounter.