const _loadedToObj = (loaded) =>
{
    const obj = {};
    loaded.forEach(l => obj[l.value.key.toString()] = l.value.value);
    return obj;
}

export default class Loader
{
    steps = [];

    /**
     * Loads the steps asynchronously, putting the returns into an array.
     * Can load multiple paths of ordered steps at the same time
    */
    async load()
    {
        const promiseSteps = this.steps.map(step => {
            return new Promise(async (resolve) => {
                const returns = [];
                let currentStep = step;
                while(currentStep)
                {
                    returns.push(await currentStep.callback());
                    currentStep = currentStep.nextStep;
                }
                resolve({key: step.key, value: returns})
            });
        });
        this.steps = [];
        return _loadedToObj(await Promise.allSettled(promiseSteps));
    }

    /**
     * Adds a step to the loader
     * @param {Function} callback the callback function for the loading step
     * @param {string} key a unique key to associate with the final values
     */
    step(callback, key)
    {
        if(typeof callback !== "function")
        {
            throw new Error("Callback must be a function.");
        }
        if(typeof key === "undefined")
        {
            throw new Error("You must include a key on top level steps.");
        }
        if(typeof key !== "string")
        {
            throw new Error("Key must be a string.");
        }
        if(this.steps.find(step => step.key === key))
        {
            throw new Error("Key already exists.")
        }

        const newStep = new Step({ callback, key });
        this.steps.push(newStep);
        return newStep;
    }
}

class Step
{
    nextStep = null;
    constructor(data)
    {
        this.callback = data.callback;
        this.key = data.key;
    }

    step(callback, overwrite = false)
    {
        if(typeof callback !== "function")
        {
            throw new Error("Callback must be a function.")
        }

        if(!overwrite && this.nextStep)
        {
            throw new Error("This step already has a next step.");
        }
        const newStep = new Step({ callback });
        this.nextStep = newStep
        return newStep;
    }
}