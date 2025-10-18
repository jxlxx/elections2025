# Montreal Elections

We are going to make a nextjs website to analyze the 3 main political parties running for mayor in Montreal 2025. 

The party platforms are in the platform directories. 

First we need to create the main data we need for the site. We need a data representation of all the campaign promises. We will just use JSON files for this. It is a very small amount of data, and it would be changing a lot.
Each campaign promise has these parts:

| Key         | Data Type       | Description                                                                                                        |
| ----------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| ID          | string          | A unique easy way to identify the promise: (`divest_from_genocide`)                                                |
| Demographic | list(string)    | A list of effected people: (`senior_citizens`, `students`, `ultra_wealthy`, `low_income`, `unhoused`, etc)         |
| Land        | list(string)    | A list of neighbourhoods this effects: (`plateau_mont_royal`, `chinatown`, etc)                                    |
| Category    | list(string)    | A list of what categories this promise pertains to: (`housing`, `taxation`, `public_transportation`, `road_works`) |
| Party       | string          | The ID of the party (`projet_montreal`, `transition_montreal`, `ensemble_montreal`)                                |
| Sources     | list(`promise`) | A list of urls/references to where this promise was made.                                                          |
| Details     | list(`details`) | A list of extra details that relate to the promise, for example what steps will be taken to accomplish it etc.     |
We can't have any "natural language" in this data representation, just keys like `projet_montreal`, etc, because we need to have translations to at least french and english. The keys will be hidden from the user. Note that I am not very good at french, so they should be in english for me to understand internally. 

So we will also need dictionaries (JSON files) `content_fr.json` and `content_en.json` which will take the keys and give the final representation of them to the user. 

The platforms of the parties are in platforms. 

There are three parties we are concerned with:
1. Projet Montreal
2. Transition Montreal
3. Ensemble Montreal

The platforms are in french. 

Build the website data like we have defined.
