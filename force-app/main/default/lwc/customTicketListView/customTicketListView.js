import { LightningElement, wire } from 'lwc';

import getTickets from "@salesforce/apex/customTicketListViewHelper.getTickets"
//import searchTickets from "@salesforce/apex/customTicketListViewHelper.searchTickets"
//import editTickets from "@salesforce/apex/customTicketListViewHelper.deleteTickets"

import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import CreatedDate from '@salesforce/schema/Account.CreatedDate';

const ACTIONS = [{label: 'Delete', name: 'delete'}]

const COLS = [{label: 'Name', fieldName: 'link', type: 'url', typeAttributes: {label: {fieldName: 'CaseNumber'}}},
            {label: 'Assunto', fieldName: 'Subject'},
            {label: 'Nome do Contato', fieldName: "contactLink", type: 'url', typeAttributes: {label: {fieldName: 'ContactName'}}},
            {label: "Status", fieldName: 'Status'},
            {label: "Prioridade", fieldName: 'Priority'},
            {label: "Data de Abertura", fieldName: 'CreatedDate'},
            { fieldName: "actions", type: 'action', typeAttributes: {rowActions: ACTIONS}}
]

export default class CustomTicketListView extends NavigationMixin(LightningElement) {
    cols = COLS;
    tickets;
    wiredTickets;
    selectedTickets;
    baseData;

    get selectedTicketsLen() {
        if(this.selectedTickets == undefined) return 0;
        return this.selectedTickets.length
    }

    @wire(getTickets)
    ticketsWire(result){
        this.wiredTickets = result;
        if(result.data){
            this.tickets = result.data.map((row) => {
                return this.mapTickets(row);
            })
            this.baseData = this.tickets;
        }
        if(result.error){
            console.error(result.error);
        }
    }

    mapTickets(row){
        var contactName = '';
        var contactLink = '';
        if(row.ContactId != undefined){
            contactLink = `/${row.ContactIdId}`;
            contactName = row.Contact['Name'];
        }

        var formattedDate = this.formatDate(row.CreatedDate);

        return {...row,
            link: `/${row.Id}`,
            ContactLink: contactLink,
            ContactName: contactName,
            CreatedDate: formattedDate,
        };
    }

    handleRowSelection(event){
        this.selectedContacts = event.detail.selectedRows;
    }

    async handleSearch(event){
        if(event.target.value == ""){
            this.contacts = this.baseData
        }else if(event.target.value.length > 1){
            const searchContacts = await searchContact({searchString: event.target.value})

            this.contacts = searchContacts.map(row => {
                return this.mapContacts(row);
            })
        }
    }

    navigateToNewRecordPage() {

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Contact',
                actionName: 'new'
            }
        });
    }

    handleRowAction(event) {
        deleteContacts({contactIds : [event.detail.row.Id]}).then(() => {
            refreshApex(this.wiredContacts);
        })
    }

    deleteSelectedContacts(){
        const idList = this.selectedContacts.map( row => { return row.Id })
        deleteContacts({contactIds : idList}).then( () => {
            refreshApex(this.wiredContacts);
        })
        this.template.querySelector('lightning-datatable').selectedRows = [];
        this.selectedContacts = undefined;
    }

    handleMergeTickets() {
        const selectedIds = this.selectedContacts.map(contact => contact.Id);
        if (selectedIds.length < 2) {
            alert('Selecione pelo menos dois tickets para mesclar.');
            return;
        }
    
        // Navegar para a página de mesclagem
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: selectedIds[0], // Registro principal
                objectApiName: 'Case', // Substitua pelo objeto correto
                relationshipApiName: 'merge',
                actionName: 'view'
            },
            state: {
                mergeRecords: selectedIds.join(',')
            }
        });
    }
    

    formatDate(dateString) {
        if (!dateString) return '';
    
        // Converte para um objeto Date
        const date = new Date(dateString);
    
        // Ajusta para UTC-3:00
        date.setHours(date.getHours() - 3);
    
        // Formata a data no padrão desejado (ex: DD/MM/YYYY HH:mm)
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
        return date.toLocaleString('pt-BR', options);
    }
    
}