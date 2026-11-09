/**
 * Learn with AI has no accounts; a workbook's code is the learner's ticket.
 * GrowthGoal does have accounts, and it lives on the same site, so this sends
 * the codes there (in the part of the address after #, which no server ever
 * sees) and the account holder says whose workbooks they are. From then on
 * the badges and skill points show on their GrowthGoal profile too.
 */
export const addToGrowthGoal = (codes: string[]) => `/workbooks/add#c=${codes.join(',')}`
