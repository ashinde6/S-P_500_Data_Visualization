import styles from "./page.module.css";
import HistoricalData from "./components/historicalData";
import Companies from "./components/companies";
import Performance from "./components/performance";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <section className={`${styles.home} ${styles.scroll}`} id="home">
          <h1 className={styles.title}>S&P 500</h1>
          <h2>Standard and Poor's 500</h2>
          <div className={styles.description}>
            <p>
              The S&P 500 Index is a collection of the largest public companies in the United States, 
              with a primary emphasis on market capitalization. The index is managed by S&P Dow Jones 
              Indices, a subsidiary of S&P Global. 
            </p>
            <br></br><br></br>
            <p>
              The S&P 500 is considered one of the best tools to 
              assess U.S. equities, stock market, and economy because of the broad performance scope 
              across 500 large-cap companies within the US economy. 
            <br></br><br></br>
              This narrative visualization will dive deeper into the historical performance of the S&P 
              500 Index. Data used to create the visuals were retrieved from these sources: <a href="https://datahub.io/core/s-and-p-500#source-data-construction" style={{ color: "#2ec4b6" }}>source1</a>, <a href="https://www.slickcharts.com/sp500" style={{ color: "#2ec4b6" }}>source 2</a>, <a href="https://www.slickcharts.com/sp500/returns" style={{ color: "#2ec4b6" }}>source3</a>.
              Please scroll down to navigate through the visualization.
            </p>
          </div>
        </section>
        <section className={styles.scroll} id="scene1">
          <HistoricalData />
        </section>
        <section className={styles.scroll} id="scene2">
          <Companies />
        </section>
        <section className={styles.scroll} id="scene3">
          <Performance />
        </section>
      </main>
      <footer className={styles.footer}>
        
      </footer>
    </div>
  );
}
