# Ethical Investment Assistant (Ethos)

> **About this copy.** Ethos is a team entry for the Microsoft x LSEG London Hackathon 2026, copied from
> [rayhanmanoly/msft-lseg-hack](https://github.com/rayhanmanoly/msft-lseg-hack) with the team's agreement.
> The research pipeline and evidence data are by Rayhan Manoly, the portfolio optimisation by Kenza Driss, and the
> frontend, report and ethics-scoring rubric by Amir. The [`analysis/`](analysis/) folder is Amir's own
> follow-up data analysis of the evidence cache, in Python and pandas.

Intake -> sector screen -> ethical vetting -> financial allocation -> interactive report. Built with Next.js and the Vercel AI SDK on Azure OpenAI.

```bash
npm install
cp .env.example .env     # add AZURE_OPENAI_API_KEY
npm run dev              # mock mode by default (USE_MOCKS=1)
```

Start with [docs/TEAM_REFERENCE.md](docs/TEAM_REFERENCE.md). Current status: [CONTEXT.md](CONTEXT.md).
