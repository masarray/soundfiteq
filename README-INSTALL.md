# SoundFit EQ — GitHub Pages Config

Copy these files into the root of your Vite React project:

```text
.gitignore
vite.config.ts
.github/workflows/deploy.yml
```

Target repository:

```text
https://github.com/masarray/soundfiteq
```

Expected GitHub Pages URL:

```text
https://masarray.github.io/soundfiteq/
```

## First-time GitHub Pages setting

In GitHub:

1. Open repository `masarray/soundfiteq`
2. Go to **Settings**
3. Open **Pages**
4. Under **Build and deployment**
5. Source: choose **GitHub Actions**

After pushing to `main`, GitHub Actions will build the Vite app and publish the `dist` folder automatically.
