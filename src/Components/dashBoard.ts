import {customElement, state} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import { map } from 'lit/directives/map.js';
import {range} from 'lit/directives/range.js';

const XMLFILE = "/data.xml";
const UNIVERSALDATE = new Date(2024, 9, 5); // Nov. 16, 2024

@customElement('my-dash-board')
export class DashBoard extends LitElement {
    @state() parsedData: Record<string, any> | null = null;

    async loadAndParseXML() {
        const response = await fetch(XMLFILE);

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
        }

        const xmlText = await response.text();
        this.parsedData = this.xmlToObject(xmlText);
    }

    private xmlToObject(xmlString: string): Record<string, any> | null {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

        if (xmlDoc.querySelector('parsererror')) {
            console.error('Error parsing XML');
            return null;
        }

        const parseNode = (node: Element): any => {
            const obj: Record<string, any> = {};

            // 解析子节点
            node.childNodes.forEach((child) => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    const childElement = child as Element;
                    const childObject = parseNode(childElement);

                    if (obj[childElement.tagName]) {
                        if (!Array.isArray(obj[childElement.tagName])) {
                            obj[childElement.tagName] = [obj[childElement.tagName]];
                        }
                        obj[childElement.tagName].push(childObject);
                    } else {
                        obj[childElement.tagName] = childObject;
                    }
                } else if (child.nodeType === Node.TEXT_NODE) {
                    const textContent = child.textContent?.trim();
                    if (textContent) {
                        obj['#text'] = textContent;
                    }
                }
            });

            if (node.attributes?.length) {
                obj['@attributes'] = {};
                Array.from(node.attributes).forEach((attr) => {
                    obj['@attributes'][attr.name] = attr.value;
                });
            }

            return obj;
        };

        return parseNode(xmlDoc.documentElement);
    }

    getSize() : number {
        return this.parsedData ? this.parsedData?.namelist.person.length : 0;
    }

    getName(c : number) : string {
        let ans = this.parsedData?.namelist.person[c]['#text']
        return this.parsedData ? ans : "loading"
    }

    getDuty(c : number) : string {
        let ans = this.parsedData?.dutylist.duty[c].name['#text']
        return this.parsedData ? ans : "loading"
    }

    getDutyCtx(c : number) : string {
        let ans = this.parsedData?.dutylist.duty[c].ctx['#text']
        return this.parsedData ? ans : "loading"
    }

    private getIdx = () =>
        Math.ceil(
            Math.floor(
                Math.abs(new Date().getTime() - UNIVERSALDATE.getTime())  //time difference in ms.
                / (1000 * 3600 * 24)
            ) / 14
        );

    private getOrder = (c : number) => (c + this.getIdx()) % this.getSize()

    private nextDuty= () => {
        const nextDate = new Date(UNIVERSALDATE);
        nextDate.setDate(UNIVERSALDATE.getDate() + 14 * this.getIdx())
        return nextDate.toLocaleDateString('en-CA');
    }

    private drawDutyTable = ()=>
        map(range(this.getSize()), (c) => {
            return html`
                <tr>
                    <td>${this.getName(c)}</td>
                    <td>${this.getDuty(this.getOrder(c))}</td>
                    <td>${this.getDuty(this.getOrder(c+1))}</td>
                </tr>`
        })
    private drawDutyQuest = () =>
        map(range(this.getSize()), (c) => {
            return html`<tr>
                <td>${this.getDuty(c)}</td>
                <td>${this.getDutyCtx(c)}</td>
            </tr>`
        })

    private main() {
        return html`
            <table class="fancy-table">
                <tr>
                    <td><b>下次值日日期：</b></td>
                    <td><b>${this.nextDuty()}</b></td>
                </tr>
            </table>
            
            <table class="fancy-table">
                <tr>
                    <td><b>姓名</b></td>
                    <td><b>本次工作内容</b></td>
                    <td><b>下次工作内容</b></td>
                </tr>
                ${this.drawDutyTable()}
            </table>
        `
    }
    private dutyQuest() {
        return html`
            <table class="fancy-table">
                <tr>
                    <td><b>工作地点</b></td>
                    <td><b>工作内容</b></td>
                </tr>
                ${this.drawDutyQuest()}
            </table>
        `
    }
    private links() {
        return html`
            <a href="https://drive.google.com/file/d/1KuFMWEFrkZb3Ja2aDjGR65wy5F2Abn53/view?usp=sharing">卫生规范</a>
        `
    }
    connectedCallback() {
        super.connectedCallback();
        this.loadAndParseXML()
    }

    render() {

        return html`
            <h1 class="title">WG值日安排</h1>
            <div>${this.main()}</div>
            <div>${this.dutyQuest()}</div>
            <div>${this.links()}</div>
        `;
    }

    static styles = css`
        /* global setting */

        :host {
            width: 90%;
            max-width: 700px;
            display: block;
            margin: 0 auto;
            text-align: center;
        }

        /* title */

        .title {
            font-size: 3rem;
            width: 100%;
            text-align: center;
        }

        /* a fancy leaderboard */

        .fancy-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            //font-size: 18px;
            text-align: center;
            background: linear-gradient(90deg, #ff9a9e, #fad0c4, #fad0c4, #fbc2eb, #a18cd1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .fancy-table th, .fancy-table td {
            border: 1px solid #dddddd;
        }

        .fancy-table th {
            background-color: #4CAF50;
        }

        .fancy-table tbody tr:hover {
            background-color: rgba(8, 138, 91, 0.4);
        }
    `;
}